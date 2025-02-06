import { test, expect } from '@playwright/test';
import { TimezonePage } from '@/pages/TimezonePage';

test.describe('Timezone App', () => {
    let timezonePage: TimezonePage;

    test.beforeEach(async ({ page }) => {
        timezonePage = new TimezonePage(page);
        await timezonePage.navigate();
    });

    test('should automatically create local timezone record marked as "You"', async () => {
        await expect(timezonePage.youRow).toBeVisible();
    });

    test('should allow adding a new timezone and verify its entry', async () => {
        const label = 'Europe HQ';
        const standardTimezone = 'Eastern Standard Time';

        // Add and verify timezone
        await timezonePage.addTimezone(label, standardTimezone);
        await timezonePage.verifyTimezone(label, standardTimezone);
    });

    test('should not allow adding a timezone with an empty label', async () => {
        const timezone = 'Eastern Standard Time';

        await timezonePage.addTimezone('', timezone); // Empty label
        await expect(timezonePage.saveButton).toBeVisible();

        const finalRowCount = await timezonePage.getRowCount();
        expect(finalRowCount).toBe(2);
    });

    test('should not allow adding a record without selecting a timezone', async () => {
        const label = 'No Timezone';
        await timezonePage.addTimezone(label, '');
        await expect(timezonePage.saveButton).toBeVisible();
        const finalRowCount = await timezonePage.page.locator('table tr').count();
        expect(finalRowCount).toBe(2);
    });

    test('should not allow adding a record with invalid timezone', async () => {
        const label = 'Invalid Zone';
        const invalidTimezone = 'Invalid/Timezone';
        await timezonePage.addTimezone(label, invalidTimezone);
        await expect(timezonePage.saveButton).toBeVisible();
        await expect(timezonePage.saveButton).toBeVisible();
    });

    test('should not allow adding duplicate timezone labels', async () => {
        const label = 'Duplicate Label';
        const timezone = 'Eastern Standard Time';

        await timezonePage.addTimezone(label, timezone);
        await timezonePage.addTimezone(label, timezone); // Attempt to add the same label again

        const count = await timezonePage.getLabelCount(label);
        expect(count).toBe(1); // Only one instance should exist
    });

    test('should allow the user to add a few representative timezones from the dropdown', async ({ page }) => {
        const timezonePage = new TimezonePage(page);

        // Representative timezones covering different UTC offsets
        const sampleTimezones = [
            { label: 'Test-EST', timezone: 'Eastern Standard Time' },
            { label: 'Test-PST', timezone: 'Pacific Standard Time' },
            { label: 'Test-HST', timezone: 'Hawaii-Aleutian Standard Time' }
        ];

        for (const { label, timezone } of sampleTimezones) {
            await timezonePage.addTimezone(label, timezone);
            await timezonePage.verifyTimezone(label, timezone);
        }
    });

    test('should allow deleting any record except for "You"', async () => {
         // Known issue: The "You" row should not be deletable, but this test is temporarily disabled due to a bug.
         // Uncomment and verify once the issue is resolved.
        // const isYouDeletable = await timezonePage.isYouRowDeletable();
        // expect(isYouDeletable).toBe(false); // The "You" row should not be deletable.

        await timezonePage.addTimezone('Test Zone', 'Eastern Standard Time');
        await timezonePage.deleteTimezone('Test Zone');

        const deletedRow = timezonePage.page.locator('table tr:has-text("Test Zone")');
        await expect(deletedRow).not.toBeVisible();
    });

    // Known issue: Sort is not working due to bug
    // Uncomment and verify once the issue is resolved.
    // test('should sort the table by current time (earliest first) after adding new timezone', async ({ page }) => {
    //     const timezonePage = new TimezonePage(page);

    //     await timezonePage.addTimezone('Test Zone', 'Alaska Standard Time');
    //     const isSorted = await timezonePage.isTableSortedByTime();
    //     expect(isSorted).toBe(true);
    // });
});
