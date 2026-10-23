# Beer Shop Manager (Android)

Replaces the paper tally. Offline, data stored in local SQLite.

- **Stock**: per brand + size (ml); add new brands/sizes, add incoming stock.
- **Rates**: set rate per brand/size (editable any time; past sales keep the rate they were sold at).
- **Sell**: daily sale entry, reduces stock, blocks selling more than stock.
- **Expense**: daily expense entries.
- **Earnings**: date-wise sales, expense and earning (sales - expense).
- **Dashboard**: selected day's sales, expense, earning, plus current stock with low-stock (<=5) flag.

Use the `<` / `>` / `Today` bar to change the working date.

Build: open this folder in Android Studio, or run `gradle assembleDebug` (needs Android SDK).
