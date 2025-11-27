import {
  PrismaClient,
  VisitModality,
  AppointmentStatus,
  Doctor,
  Treatment,
  Patient,
} from '@prisma/client';
import { ScrapedDoctor, GeneratedPatient } from '../types/index.js';
import { Env } from '../config/env.js';
import { faker } from '@faker-js/faker';
import { Logger } from '../utils/logger.js';
import { ProgressUtils } from '../utils/progress.js';

type DoctorWithTreatments = Doctor & { treatments: Treatment[] };

export class DbService {
  private prisma: PrismaClient;
  private logger: Logger;

  constructor(private env: Env) {
    this.prisma = new PrismaClient();
    this.logger = new Logger(env.LOG_LEVEL);
  }

  async connect() {
    await this.prisma.$connect();
    this.logger.info('Connected to database');
  }

  async disconnect() {
    await this.prisma.$disconnect();
    this.logger.info('Disconnected from database');
  }

  async seedDatabase(doctors: ScrapedDoctor[], patients: GeneratedPatient[]) {
    this.logger.info('🌱 Starting database seeding process...');

    const createdDoctors = await this.seedDoctors(doctors);
    const createdPatients = await this.seedPatients(patients);
    await this.seedAppointments(createdDoctors, createdPatients);

    this.logger.info('✅ Database seeding completed successfully.');
  }

  // Public method to allow parallel execution from main.ts
  async seedDoctors(doctors: ScrapedDoctor[]) {
    this.logger.info(`Processing ${doctors.length} doctors...`);

    // Batch check for existing doctors (1 query instead of N)
    const existingDoctors = await this.prisma.doctor.findMany({
      where: {
        sourceProfileUrl: { in: doctors.map((d) => d.sourceProfileUrl) },
      },
      select: { sourceProfileUrl: true },
    });

    const existingUrls = new Set(existingDoctors.map((d) => d.sourceProfileUrl));
    const newDoctors = doctors.filter((d) => !existingUrls.has(d.sourceProfileUrl));

    if (newDoctors.length === 0) {
      this.logger.info('⏭️ No new doctors to seed (all already exist).');
      return [];
    }

    this.logger.info(`Found ${newDoctors.length} new doctors to seed...`);

    const bar = ProgressUtils.createBar(
      ProgressUtils.getStandardFormat('Seeding Doctors'),
      this.logger,
    );
    bar.start(newDoctors.length, 0);

    const createdDoctors: DoctorWithTreatments[] = [];

    // Note: We can't use createMany for doctors because they have nested relations
    // (treatments and availability). Prisma doesn't support nested createMany.
    // However, we've already optimized the duplicate check to a single query.
    for (const doc of newDoctors) {
      try {
        const createdDoc = await this.prisma.doctor.create({
          data: {
            fullName: doc.fullName,
            specialty: doc.specialty,
            city: doc.city,
            address: doc.address,
            phoneCountryCode: doc.phoneCountryCode,
            phoneNumber: doc.phoneNumber,
            rating: doc.rating,
            reviewCount: doc.reviewCount,
            sourceProfileUrl: doc.sourceProfileUrl,
            treatments: {
              create: doc.treatments.map((t) => ({
                name: t.name,
                price: t.price,
                currency: t.currency,
              })),
            },
            availability: {
              create: doc.availability.map((a) => ({
                startAt: a.startAt,
                endAt: a.endAt,
                modality:
                  a.modality === 'in_person' ? VisitModality.in_person : VisitModality.online,
              })),
            },
          },
          include: { treatments: true },
        });
        createdDoctors.push(createdDoc);
      } catch (error) {
        this.logger.error(`Failed to create doctor ${doc.fullName}`, error);
      }
      bar.increment();
    }
    bar.stop();
    this.logger.info(`✅ Seeded ${createdDoctors.length} new doctors.`);
    return createdDoctors;
  }

  // Public method to allow flexible seeding from main.ts
  async seedPatients(patients: GeneratedPatient[]) {
    this.logger.info(`Processing ${patients.length} patients...`);

    const bar = ProgressUtils.createBar(
      ProgressUtils.getStandardFormat('Seeding Patients'),
      this.logger,
    );
    bar.start(patients.length, 0);

    try {
      // Batch insert all patients in a single query
      await this.prisma.patient.createMany({
        data: patients,
        skipDuplicates: true,
      });

      // Fetch all created patients to return them
      const createdPatients = await this.prisma.patient.findMany({
        orderBy: { createdAt: 'desc' },
        take: patients.length,
      });

      bar.update(patients.length);
      bar.stop();
      this.logger.info(`✅ Seeded ${createdPatients.length} new patients.`);
      return createdPatients;
    } catch (error) {
      bar.stop();
      this.logger.error('Failed to create patients in batch', error);
      return [];
    }
  }

  // Public method to allow flexible seeding from main.ts
  async seedAppointments(createdDoctors: DoctorWithTreatments[], createdPatients: Patient[]) {
    this.logger.info('📅 Generating appointments...');

    let allDoctors = createdDoctors;
    // If no new doctors were created, fetch existing ones
    if (allDoctors.length === 0) {
      this.logger.info('No new doctors created, fetching existing doctors from DB...');
      allDoctors = await this.prisma.doctor.findMany({ include: { treatments: true } });
    }

    if (allDoctors.length === 0 || createdPatients.length === 0) {
      this.logger.warn(
        '⚠️ Not enough data to generate appointments (missing doctors or patients).',
      );
      return;
    }

    const targetAppointments = this.env.APPOINTMENTS_COUNT;

    const bar = ProgressUtils.createBar(
      ProgressUtils.getStandardFormat('Generating Appointments'),
      this.logger,
    );
    bar.start(targetAppointments, 0);

    // Generate all appointments data first (in-memory)
    const appointmentsData = [];
    let attempts = 0;
    const maxAttempts = targetAppointments * 2; // Prevent infinite loop

    while (appointmentsData.length < targetAppointments && attempts < maxAttempts) {
      attempts++;
      const doctor = faker.helpers.arrayElement(allDoctors);
      const patient = faker.helpers.arrayElement(createdPatients);

      if (!doctor.treatments || doctor.treatments.length === 0) {
        continue;
      }

      const treatment = faker.helpers.arrayElement(doctor.treatments);
      if (!treatment) continue;

      const startAt = faker.date.soon({ days: 30 });
      const endAt = new Date(startAt.getTime() + 30 * 60000);

      appointmentsData.push({
        doctorId: doctor.id,
        patientId: patient.id,
        treatmentId: treatment.id,
        startAt,
        endAt,
        status: AppointmentStatus.scheduled,
      });
    }

    try {
      // Batch insert all appointments in a single query
      await this.prisma.appointment.createMany({
        data: appointmentsData,
        skipDuplicates: true,
      });

      bar.update(appointmentsData.length);
      bar.stop();
      this.logger.info(`✅ Generated ${appointmentsData.length} appointments.`);
    } catch (error) {
      bar.stop();
      this.logger.error('Failed to create appointments in batch', error);
    }
  }
}
