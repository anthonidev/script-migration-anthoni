import fs from 'fs/promises';
import path from 'path';
import puppeteer, { Browser } from 'puppeteer';
import { Env } from '../config/env.js';
import { Logger } from '../utils/logger.js';
import { ProgressUtils } from '../utils/progress.js';
import { ScrapedDoctor } from '../types/index.js';
import { SearchScraper } from './doctoralia/search-scraper.js';
import { ProfileScraper } from './doctoralia/profile-scraper.js';

export class DoctoraliaScraper {
  private browser: Browser | null = null;
  private logger: Logger;
  private searchScraper: SearchScraper | null = null;
  private profileScraper: ProfileScraper | null = null;

  constructor(private env: Env) {
    this.logger = new Logger(env.LOG_LEVEL);
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // Initialize sub-scrapers
    this.profileScraper = new ProfileScraper(this.env, this.browser);
    this.searchScraper = new SearchScraper(this.env, this.profileScraper);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async scrape() {
    if (!this.browser) await this.initialize();

    const cities = this.env.SCRAPING_CITIES.split(',').map((c) => c.trim());
    const specialties = this.env.SCRAPING_SPECIALTIES.split(',').map((s) => s.trim());
    const results: ScrapedDoctor[] = [];

    const totalTasks = cities.length * specialties.length;
    const bar = ProgressUtils.createBar(
      ProgressUtils.getStandardFormat('Scraping Progress'),
      this.logger,
    );
    bar.start(totalTasks, 0);

    for (const city of cities) {
      const domain = this.getDomainForCity(city);
      if (!domain) {
        this.logger.warn(`⚠️ No domain mapping for city: ${city}, skipping.`);
        bar.increment(specialties.length); // Skip all specialties for this city
        continue;
      }

      for (const specialty of specialties) {
        try {
          const page = await this.browser!.newPage();
          const doctors = await this.searchScraper!.scrapeSearchPage(page, domain, city, specialty);
          results.push(...doctors);
          await page.close();
        } catch (error) {
          this.logger.error(`❌ Error scraping ${city}/${specialty}:`, error);
        }
        bar.increment();
      }
    }
    bar.stop();

    // Save to JSON
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(path.join(dataDir, 'doctors.json'), JSON.stringify(results, null, 2));

    this.logger.info(`💾 Saved ${results.length} doctors to data/doctors.json`);
    return results;
  }

  private getDomainForCity(city: string): string | null {
    const lower = city.toLowerCase();
    if (lower.includes('lima')) return 'www.doctoralia.pe';
    if (lower.includes('bogot')) return 'www.doctoralia.co';
    if (lower.includes('madrid') || lower.includes('barcelona')) return 'www.doctoralia.es';
    return null;
  }
}
