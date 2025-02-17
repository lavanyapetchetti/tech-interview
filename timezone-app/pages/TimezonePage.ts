import { Page, Locator, expect } from '@playwright/test';

export class TimezonePage {
    readonly page: Page;
    readonly addTimezoneButton: Locator;
    readonly labelInput: Locator;
    readonly timezoneDropdown: Locator;
    readonly saveButton: Locator;
    readonly timezoneTable: Locator;
    readonly youRow: Locator;

    constructor(page: Page) {
        this.page = page;
        this.addTimezoneButton = page.locator('button:has-text("Add timezone")');
        this.labelInput = page.locator('input[name="label"]');
        this.timezoneDropdown = page.locator('select[name="timezone"]');
        this.saveButton = page.locator('button:has-text("Save")');
        this.timezoneTable = page.locator('table tbody');
        this.youRow = page.locator('table tr:has-text("You")');
    }

    // Mapping Standard Timezone Names to IANA Timezones
    private timezoneMap: Record<string, string> = {
        "Eastern Standard Time": "America/New_York",
        "Central Standard Time": "America/Chicago",
        "Mountain Standard Time": "America/Denver",
        "Pacific Standard Time": "America/Los_Angeles",
        "Alaska Standard Time": "America/Juneau",
        "Hawaii-Aleutian Standard Time": "Pacific/Honolulu"
    };

    async navigate() {
        await this.page.goto('http://localhost:3000');
    }

    async getTimezoneTime(timezone: string): Promise<string> {
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: timezone
        }).format(new Date());
    }

    async addTimezone(label: string, standardTimezone: string) {
        await expect(this.addTimezoneButton).toBeVisible();
        await this.addTimezoneButton.click();
        await this.labelInput.fill(label);

        const availableOptions = await this.timezoneDropdown.locator('option').allInnerTexts();
        if (!availableOptions.includes(standardTimezone)) {
            console.log(`⚠️ Invalid timezone: "${standardTimezone}" is not in the dropdown options.`);
            return;
        }

        await this.timezoneDropdown.selectOption(standardTimezone);
        await this.saveButton.click();
        await this.page.waitForTimeout(500);
    }

    async verifyTimezone(label: string, standardTimezone: string) {
        const newRow = this.page.locator(`table tr:has-text("${label}")`);
        await expect(newRow).toBeVisible();

        await expect(newRow.locator('td:nth-child(1)')).toHaveText(label);
        await expect(newRow.locator('td:nth-child(2)')).toHaveText(new RegExp(`${standardTimezone}|${this.timezoneMap[standardTimezone]}`));

        const nowInTimezone = await this.getTimezoneTime(this.timezoneMap[standardTimezone] || standardTimezone);
        await expect(newRow.locator('td:nth-child(3)')).toHaveText(nowInTimezone);
        await this.page.waitForTimeout(500);
    }

    async getSortedTimes(): Promise<string[]> {
        return await this.page.locator('table tbody tr td:nth-child(2)').allTextContents();
    }

    async isTableSortedByTime() {
        const times = await this.getSortedTimes();

        // Convert times to comparable Date objects
        const timeValues = times.map(time => new Date(`1970-01-01T${time}:00Z`).getTime());

        // Create a sorted copy of timeValues
        const sortedTimes = [...timeValues].sort((a, b) => a - b);

        // Return true if sorted, false otherwise
        return timeValues.every((val, index) => val === sortedTimes[index]);
    }

    async deleteTimezone(label: string) {
        const row = this.page.locator(`table tr:has-text("${label}")`);
        const deleteButton = row.locator('button:has-text("Delete")');
        await deleteButton.click();
    }

    async isYouRowDeletable(): Promise<boolean> {
        const deleteButton = this.youRow.locator('button:has-text("Delete")');
        return await deleteButton.isEnabled();
    }

    async getLabelCount(label: string) {
        return await this.page.locator(`table tr:has-text("${label}")`).count();
    }

    async getRowCount() {
        return await this.page.locator('table tr').count(); // Counts total rows in the table
    }
}
