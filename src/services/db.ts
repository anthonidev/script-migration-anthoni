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

  private async seedDoctors(doctors: ScrapedDoctor[]) {
    this.logger.info(`Processing ${doctors.length} doctors...`);
    const createdDoctors: DoctorWithTreatments[] = [];

    for (const doc of doctors) {
      // Avoid duplicates based on sourceProfileUrl
      const exists = await this.prisma.doctor.findFirst({
        where: { sourceProfileUrl: doc.sourceProfileUrl },
      });

      if (exists) {
        this.logger.debug(`Doctor already exists: ${doc.fullName}`);
        continue;
      }

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
    }
    this.logger.info(`✅ Seeded ${createdDoctors.length} new doctors.`);
    return createdDoctors;
  }

  private async seedPatients(patients: GeneratedPatient[]) {
    this.logger.info(`Processing ${patients.length} patients...`);
    const createdPatients: Patient[] = [];

    for (const p of patients) {
      try {
        const createdPatient = await this.prisma.patient.create({
          data: p,
        });
        createdPatients.push(createdPatient);
      } catch (error) {
        this.logger.error(`Failed to create patient ${p.fullName}`, error);
      }
    }
    this.logger.info(`✅ Seeded ${createdPatients.length} new patients.`);
    return createdPatients;
  }

  private async seedAppointments(
    createdDoctors: DoctorWithTreatments[],
    createdPatients: Patient[],
  ) {
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

    let appointmentCount = 0;
    const targetAppointments = this.env.APPOINTMENTS_COUNT;

    while (appointmentCount < targetAppointments) {
      const doctor = faker.helpers.arrayElement(allDoctors);
      const patient = faker.helpers.arrayElement(createdPatients);

      if (!doctor.treatments || doctor.treatments.length === 0) {
        continue;
      }

      const treatment = faker.helpers.arrayElement(doctor.treatments);
      if (!treatment) continue;

      const startAt = faker.date.soon({ days: 30 });
      const endAt = new Date(startAt.getTime() + 30 * 60000);

      try {
        await this.prisma.appointment.create({
          data: {
            doctorId: doctor.id,
            patientId: patient.id,
            treatmentId: treatment.id,
            startAt,
            endAt,
            status: AppointmentStatus.scheduled,
          },
        });
        appointmentCount++;
      } catch (error) {
        this.logger.error('Failed to create appointment', error);
      }
    }
    this.logger.info(`✅ Generated ${appointmentCount} appointments.`);
  }
}
