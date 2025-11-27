import { Page } from 'puppeteer';
import pLimit from 'p-limit';
import { Env } from '../../config/env.js';
import { Logger } from '../../utils/logger.js';
import { ScrapedDoctor } from '../../types/index.js';
import { ProfileScraper } from './profile-scraper.js';

export class SearchScraper {
  private logger: Logger;

  constructor(
    private env: Env,
    private profileScraper: ProfileScraper,
  ) {
    this.logger = new Logger(env.LOG_LEVEL);
  }

  async scrapeSearchPage(
    page: Page,
    domain: string,
    city: string,
    specialty: string,
  ): Promise<ScrapedDoctor[]> {
    const doctors: ScrapedDoctor[] = [];

    try {
      // Search URL pattern: https://www.doctoralia.pe/buscar?q=Cardiólogo&loc=Lima
      const searchUrl = `https://${domain}/buscar?q=${encodeURIComponent(specialty)}&loc=${encodeURIComponent(city)}`;
      await page.goto(searchUrl, {
        waitUntil: 'networkidle2',
        timeout: this.env.SCRAPING_TIMEOUT_MS,
      });

      // Accept cookies if present (simple attempt)
      try {
        const cookieBtn = await page.$('#onetrust-accept-btn-handler');
        if (cookieBtn) await cookieBtn.click();
      } catch {
        // Ignore if cookie button not found or click fails
      }

      // Get doctor links from the list
      // Fallback to generic link collection and filtering if testid is missing
      const allLinks = await page.$$eval('a', (links) => links.map((l) => l.href));
      const doctorLinks = allLinks
        .filter((href) => {
          // Pattern: domain/doctor-name/specialty/city
          // e.g. https://www.doctoralia.pe/juan-perez/cardiologo/lima
          // Exclude search, login, etc.
          return (
            !href.includes('/buscar') &&
            !href.includes('/login') &&
            !href.includes('/preguntas-respuestas') &&
            !href.includes('/enfermedades') &&
            href.split('/').length >= 5
          );
        })
        .slice(0, this.env.MAX_DOCTORS_PER_SEARCH); // Limit doctors per search

      // Scrape profiles with concurrency control
      const limit = pLimit(this.env.SCRAPING_CONCURRENCY);
      const profilePromises = doctorLinks.map((link) =>
        limit(async () => {
          try {
            const doctor = await this.profileScraper.scrapeDoctorProfile(link, city, specialty);
            return doctor;
          } catch (e) {
            this.logger.error(`Failed to scrape profile ${link}:`, e);
            return null;
          }
        }),
      );

      const profiles = await Promise.all(profilePromises);
      doctors.push(...profiles.filter((d): d is ScrapedDoctor => d !== null));
    } catch (error) {
      this.logger.error(`Error scraping search page for ${city}/${specialty}:`, error);
    }

    return doctors;
  }
}
