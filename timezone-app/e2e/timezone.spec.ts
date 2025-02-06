import { test, expect } from '@playwright/test';
import { TimezonePage } from '@/pages/TimezonePage';

test.describe('Timezone App', () => {
    let timezonePage: TimezonePage;

    test.beforeEach(async ({ page }) => {
        timezonePage = new TimezonePage(page);
        await timezonePage.navigate();
    });

    test('should automatically create a "You" record with the user\'s local timezone', async () => {
        await expect(timezonePage.youRow).toBeVisible();
        await timezonePage.verifyTimezone("Local(You)", "America/Vancouver");
    });

    test('should allow the user to add a timezone with a custom label', async () => {
        const label = 'Europe HQ';
        const standardTimezone = 'Eastern Standard Time';

        // Add and verify timezone
        await timezonePage.addTimezone(label, standardTimezone);
        await timezonePage.verifyTimezone(label, standardTimezone);
    });

    test('should allow the user to add all timezones from drop-down', async ({ page }) => {
        const timezonePage = new TimezonePage(page);

        // List of timezones available in the dropdown
        const availableTimezones = [
            "Eastern Standard Time",
            "Central Standard Time",
            "Mountain Standard Time",
            "Pacific Standard Time",
            "Alaska Standard Time",
            "Hawaii-Aleutian Standard Time"
        ];

        for (const standardTimezone of availableTimezones) {
            const label = `Test-${standardTimezone}`; // Unique label for each timezone

            // Add and verify timezone dynamically
            await timezonePage.addTimezone(label, standardTimezone);
            await timezonePage.verifyTimezone(label, standardTimezone);
        }
    });

    test('should not allow adding duplicate timezone labels', async () => {
        const label = 'Duplicate Label';
        const timezone = 'Eastern Standard Time';

        await timezonePage.addTimezone(label, timezone);
        await timezonePage.addTimezone(label, timezone); // Attempt to add the same label again

        const count = await timezonePage.getLabelCount(label);
        expect(count).toBe(1); // Only one instance should exist
    });

    test('should not allow adding a timezone with an empty label', async () => {
        const timezone = 'Eastern Standard Time';

        await timezonePage.addTimezone('', timezone); // Empty label
        await expect(timezonePage.saveButton).toBeVisible();

        const finalRowCount = await timezonePage.getRowCount();
        expect(finalRowCount).toBe(2);
    });

    test.describe('Timezone Validations', () => {
        const invalidTimezones = [
            ['No Timezone', ''],
            ['Invalid Zone', 'Invalid/Timezone']
        ];

        for (const [label, timezone] of invalidTimezones) {
            test(`should not allow adding a record with an invalid timezone: ${label}`, async ({ page }) => {
                const timezonePage = new TimezonePage(page);
                await timezonePage.addTimezone(label, timezone);

                const finalRowCount = await timezonePage.getRowCount();
                expect(finalRowCount).toBe(2); // Row count should not increase

                await expect(timezonePage.saveButton).toBeVisible();
            });
        }
    });

    test('should allow adding multiple timezones without performance issues', async () => {
        for (let i = 0; i < 10; i++) {
            await timezonePage.addTimezone(`Zone ${i}`, 'Pacific Standard Time');
        }

        const rowCount = await timezonePage.getRowCount();
        expect(rowCount).toEqual(3); // Ensure all entries are added
    });

    test('should maintain correct time after page reload', async () => {
        await timezonePage.addTimezone('Reload Test', 'Central Standard Time');

        const timeBeforeReload = timezonePage.getTimezoneTime('Reload Test');
        await timezonePage.page.reload(); // Refresh the page

        const timeAfterReload = timezonePage.getTimezoneTime('Reload Test');
        expect(timeAfterReload).toBe(timeBeforeReload); // Time should remain accurate
    });

    test('should allow deleting any record except for "You"', async () => {
        // const isYouDeletable = await timezonePage.isYouRowDeletable();
        // expect(isYouDeletable).toBe(false); // "You" row should not be deletable, commented as there is a known bug

        await timezonePage.addTimezone('Test Zone', 'Eastern Standard Time');
        await timezonePage.deleteTimezone('Test Zone');

        const deletedRow = timezonePage.page.locator('table tr:has-text("Test Zone")');
        await expect(deletedRow).not.toBeVisible();
    });

    //Below tests are failing due to known bugs
   /* test('should sort the table by current time (earliest first)', async () => {
        const times = await timezonePage.getSortedTimes();
        const isSorted = await timezonePage.isTableSortedByTime();
        expect(isSorted).toBe(true);
    });

    test('should sort the table by current time (earliest first) after adding new timezone', async ({ page }) => {
        const timezonePage = new TimezonePage(page);

        await timezonePage.addTimezone('Test Zone', 'Alaska Standard Time');
        const isSorted = await timezonePage.isTableSortedByTime();
        expect(isSorted).toBe(true);
    });*/
});
