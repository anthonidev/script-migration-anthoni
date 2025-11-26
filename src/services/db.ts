import { PrismaClient, VisitModality, AppointmentStatus } from '@prisma/client';
import { ScrapedDoctor, GeneratedPatient } from '../types/index.js';
import { Env } from '../config/env.js';
import { faker } from '@faker-js/faker';

export class DbService {
    private prisma: PrismaClient;

    constructor(private env: Env) {
        this.prisma = new PrismaClient();
    }

    async connect() {
        await this.prisma.$connect();
    }

    async disconnect() {
        await this.prisma.$disconnect();
    }

    async seedDatabase(doctors: ScrapedDoctor[], patients: GeneratedPatient[]) {
        console.log('🌱 Seeding database...');

        // 1. Insert Doctors
        const createdDoctors = [];

        for (const doc of doctors) {
            // Avoid duplicates based on sourceProfileUrl or name/city
            const exists = await this.prisma.doctor.findFirst({
                where: { sourceProfileUrl: doc.sourceProfileUrl }
            });

            if (exists) continue;

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
                        create: doc.treatments.map(t => ({
                            name: t.name,
                            price: t.price,
                            currency: t.currency
                        }))
                    },
                    availability: {
                        create: doc.availability.map(a => ({
                            startAt: a.startAt,
                            endAt: a.endAt,
                            modality: a.modality === 'in_person' ? VisitModality.in_person : VisitModality.online
                        }))
                    }
                },
                include: { treatments: true }
            });
            createdDoctors.push(createdDoc);
        }
        console.log(`✅ Seeded ${createdDoctors.length} doctors.`);

        // 2. Insert Patients
        const createdPatients = [];
        for (const p of patients) {
            const createdPatient = await this.prisma.patient.create({
                data: p
            });
            createdPatients.push(createdPatient);
        }
        console.log(`✅ Seeded ${createdPatients.length} patients.`);

        // 3. Generate Appointments
        let allDoctors = createdDoctors;
        if (allDoctors.length === 0) {
            allDoctors = await this.prisma.doctor.findMany({ include: { treatments: true } });
        }

        if (allDoctors.length === 0 || createdPatients.length === 0) {
            console.warn('⚠️ Not enough data to generate appointments.');
            return;
        }

        console.log('📅 Generating appointments...');
        let appointmentCount = 0;
        const targetAppointments = this.env.APPOINTMENTS_COUNT;

        while (appointmentCount < targetAppointments) {
            const doctor = faker.helpers.arrayElement(allDoctors);
            const patient = faker.helpers.arrayElement(createdPatients);
            if (doctor.treatments.length === 0) continue;
            const treatment = faker.helpers.arrayElement(doctor.treatments);

            if (!treatment) continue;

            // Random date in the future
            const startAt = faker.date.soon({ days: 30 });
            const endAt = new Date(startAt.getTime() + 30 * 60000);

            await this.prisma.appointment.create({
                data: {
                    doctorId: doctor.id,
                    patientId: patient.id,
                    treatmentId: treatment.id,
                    startAt,
                    endAt,
                    status: AppointmentStatus.scheduled
                }
            });
            appointmentCount++;
        }
        console.log(`✅ Generated ${appointmentCount} appointments.`);
    }
}
