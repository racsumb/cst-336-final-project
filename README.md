# the quest of life

look at the requirements doc: https://docs.google.com/document/d/1FzuVKSV8tysk8Yjg3A60seoDqlphLchDjlJMi3I9-sg/edit?tab=t.0#heading=h.v97igzvdvm77

## Running the project locally

```
npm install
npm run dev
```

## Database

1. You can run the DB locally using the `database/schema.sql` in the repo.
2. From there you would update `database/db.js` to update the credentials to your locally running instance.

OR

1. You can run the app against the production DB on heroku.
2. Ensure your `.env` file is set.

You can then test the DB connection via:

```
node test-db.js
```