import { Browser, Page } from 'puppeteer';
import { Env } from '../../config/env.js';
import { Logger } from '../../utils/logger.js';
import { ScrapedDoctor } from '../../types/index.js';

export class ProfileScraper {
  private logger: Logger;

  constructor(
    private env: Env,
    private browser: Browser,
  ) {
    this.logger = new Logger(env.LOG_LEVEL);
  }

  async scrapeDoctorProfile(
    url: string,
    city: string,
    specialty: string,
  ): Promise<ScrapedDoctor | null> {
    const page = await this.browser.newPage();
    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: this.env.SCRAPING_TIMEOUT_MS,
      });

      // Extract basic info
      const fullName = await page
        .$eval('h1', (el) => el.textContent?.trim().replace(/\s+/g, ' ') || '')
        .catch(() => 'Unknown');
      const address = await page
        .$eval('[data-testid="address-link"]', (el) => el.textContent?.trim() || '')
        .catch(() => city); // Fallback

      // Rating
      const rating = await page
        .$eval('.unified-doctor-header-info__rating-text', (el) => {
          const score = el.getAttribute('data-score');
          return score ? parseFloat(score) : 0;
        })
        .catch(() => 0);

      const reviewCount = await page
        .$eval('.unified-doctor-header-info__rating-text span', (el) => {
          const text = el.textContent?.replace(/\D/g, '');
          return text ? parseInt(text) : 0;
        })
        .catch(() => 0);

      // Treatments
      let treatments: Array<{ name: string; price?: number; currency: string }> = [];
      try {
        treatments = await page.$$eval('[data-id="service-item"]', (items) =>
          items.map((item) => {
            const name =
              item.querySelector('h3[itemprop="availableService"]')?.textContent?.trim() ||
              'Consulta';
            const priceContainer = item.querySelector('.d-flex .mr-1');
            const priceText = priceContainer?.textContent?.trim();
            let price: number | undefined;
            if (priceText) {
              const matches = priceText.match(/(\d+[.,]?\d*)/);
              if (matches && matches[1]) {
                price = parseFloat(matches[1].replace(',', '.'));
              }
            }
            return { name, price, currency: 'PEN' };
          }),
        );
      } catch {
        this.logger.warn(`Failed to scrape treatments for ${url}, using fallback.`);
      }

      // Fallback for treatments
      if (treatments.length === 0) {
        this.logger.warn(`No treatments found for ${url}, generating fake data.`);
        treatments = this.generateFakeTreatments(specialty);
      } else {
        // Limit services based on env var
        treatments = treatments.slice(0, this.env.MAX_SERVICES_COUNT);
      }

      // Availability
      let availability: Array<{ startAt: string; endAt: string; modality: string }> = [];
      try {
        availability = await this.scrapeAvailability(page);
      } catch {
        this.logger.warn(`Failed to scrape availability for ${url}, using fallback.`);
      }

      // Fallback for availability
      if (availability.length === 0) {
        this.logger.warn(`No availability found for ${url}, generating fake data.`);
        availability = this.generateFakeAvailability();
      } else {
        // Limit slots based on env var
        availability = availability.slice(0, this.env.MAX_AVAILABILITY_SLOTS_COUNT);
      }

      return {
        fullName,
        specialty,
        city,
        address,
        phoneCountryCode: '+51', // Default/Placeholder
        phoneNumber: '999888777', // Placeholder
        rating,
        reviewCount,
        sourceProfileUrl: url,
        treatments,
        availability,
      };
    } catch (error) {
      this.logger.error(`Error scraping profile ${url}:`, error);
      this.logger.warn(`Generating fake profile for ${url} due to error.`);
      return this.generateFakeProfile(url, city, specialty);
    } finally {
      await page.close();
    }
  }

  private async scrapeAvailability(
    page: Page,
  ): Promise<Array<{ startAt: string; endAt: string; modality: string }>> {
    const availability: Array<{ startAt: string; endAt: string; modality: string }> = [];

    // Check if calendar is available
    const noCalendar = await page
      .$eval('.calendar-desktop', (el: Element) =>
        el.textContent?.includes('Este especialista aún no ofrece el calendario online'),
      )
      .catch(() => false);
    if (noCalendar) return [];

    // Tabs: Visita presencial / Consulta online
    const tabs = await page.$$('.nav-tabs .nav-item a');

    for (const tab of tabs) {
      const tabText = await tab.evaluate((el: Element) => el.textContent?.trim());
      const isOnline = tabText?.toLowerCase().includes('online');
      const modality = isOnline ? 'online' : 'in_person';

      // Click tab using evaluate
      await tab.evaluate((el: HTMLElement) => el.click());
      await new Promise((r) => setTimeout(r, 1000));

      // Expand hours if "Mostrar más horas" exists
      try {
        const showMoreBtn = await page.$('.dp-calendar-more button');
        if (showMoreBtn) {
          await showMoreBtn.evaluate((el: HTMLElement) => el.click());
          await new Promise((r) => setTimeout(r, 500));
        }
      } catch {
        // Ignore
      }

      // Scrape visible days
      const days = await page.$$('.dp-carousel-item');
      for (const day of days) {
        const slots = await day.$$('.calendar-slot-available');
        if (slots.length > 0) {
          const times: string[] = [];
          let dateStr = '';

          for (const slot of slots) {
            const ariaLabel = await slot.evaluate((el: Element) => el.getAttribute('aria-label'));
            if (ariaLabel) {
              const parts = ariaLabel.split(' ');
              if (parts.length >= 1) {
                times.push(parts[0]);
                if (!dateStr && parts.length >= 4) {
                  dateStr = parts.slice(2).join(' '); // "01 Dic"
                }
              }
            }
          }

          if (times.length > 0 && dateStr) {
            const monthMap: { [key: string]: number } = {
              Ene: 0,
              Feb: 1,
              Mar: 2,
              Abr: 3,
              May: 4,
              Jun: 5,
              Jul: 6,
              Ago: 7,
              Sep: 8,
              Oct: 9,
              Nov: 10,
              Dic: 11,
            };
            const [dayStr, monthStr] = dateStr.split(' ');
            const month = monthMap[monthStr];

            if (month !== undefined) {
              const now = new Date();
              let year = now.getFullYear();
              if (now.getMonth() === 11 && month === 0) {
                year += 1;
              }

              const date = new Date(year, month, parseInt(dayStr));

              const firstTime = times[0];
              const lastTime = times[times.length - 1];

              const addSlot = (time: string) => {
                const [hours, minutes] = time.split(':').map(Number);
                const start = new Date(date);
                start.setHours(hours, minutes, 0, 0);
                const end = new Date(start.getTime() + 30 * 60000);

                availability.push({
                  startAt: start.toISOString(),
                  endAt: end.toISOString(),
                  modality,
                });
              };

              addSlot(firstTime);
              if (lastTime !== firstTime) {
                addSlot(lastTime);
              }
            }
          }
        }
      }
    }

    return availability;
  }

  private generateFakeTreatments(
    specialty: string,
  ): Array<{ name: string; price: number; currency: string }> {
    const treatments = [];
    const count = Math.floor(Math.random() * 3) + 2; // 2 to 4 treatments
    for (let i = 0; i < count; i++) {
      treatments.push({
        name: i === 0 ? `Consulta de ${specialty}` : `Tratamiento de ${specialty} ${i + 1}`,
        price: Math.floor(Math.random() * 200) + 50,
        currency: 'PEN',
      });
    }
    return treatments;
  }

  private generateFakeAvailability(): Array<{
    startAt: string;
    endAt: string;
    modality: string;
  }> {
    const availability = [];
    const today = new Date();
    for (let i = 1; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      // Morning slot
      date.setHours(9, 0, 0, 0);
      availability.push({
        startAt: date.toISOString(),
        endAt: new Date(date.getTime() + 30 * 60000).toISOString(),
        modality: 'in_person',
      });

      // Afternoon slot
      date.setHours(16, 0, 0, 0);
      availability.push({
        startAt: date.toISOString(),
        endAt: new Date(date.getTime() + 30 * 60000).toISOString(),
        modality: 'in_person',
      });
    }
    return availability;
  }

  private generateFakeProfile(url: string, city: string, specialty: string): ScrapedDoctor {
    return {
      fullName: 'Doctor (Datos Simulados)',
      specialty,
      city,
      address: `${city}, Dirección simulada`,
      phoneCountryCode: '+51',
      phoneNumber: '999000111',
      rating: 0,
      reviewCount: 0,
      sourceProfileUrl: url,
      treatments: this.generateFakeTreatments(specialty),
      availability: this.generateFakeAvailability(),
    };
  }
}
