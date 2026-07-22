# Zasocitinib CMS Content

This folder contains the CMS content structure for the Zasocitinib patient treatment tracker app.

## Folder Structure

```
cms/
├── content-type-definition.json    # SF CMS content type schema
├── README.md                       # This file
└── articles/
    ├── article-emotional-wellbeing.json
    ├── article-itch-relief.json
    ├── article-sleep-quality.json
    ├── article-work-productivity.json
    └── images/
        ├── hero-emotional.svg      # Purple-pink gradient, heart + connection
        ├── hero-itch.svg           # Orange-amber gradient, shield + relief
        ├── hero-sleep.svg          # Indigo-blue gradient, moon + stars
        └── hero-work.svg           # Orange-red gradient, briefcase + energy
```

## Content Type: `zasocitinib_article`

Each article JSON follows the Salesforce CMS content structure with typed fields:

| Field | Type | Purpose |
|-------|------|---------|
| `title` | text | Article headline |
| `summary` | text | 1-2 sentence card preview |
| `heroImage` | image | Card and article header visual |
| `body` | richtext | Full HTML article content |
| `category` | text | Maps to Education Hub categories |
| `tag` | text | Short display tag on cards |
| `tagColor` | text | Tailwind CSS tag styling classes |
| `gradient` | text | Tailwind gradient for card hero |
| `readTime` | text | Estimated reading time |
| `psodiskDomains` | text | PsOdisk targeting domains |
| `nrsMin` / `nrsMax` | number | NRS itch score trigger range |

## Personalisation Targeting

Articles are personalised based on two patient signals:

1. **PsOdisk domain scores** — When a patient scores low on a specific wellbeing domain (emotional, sleep, social, work, body), articles addressing that domain surface higher.
2. **NRS itch intensity** — Articles about itch management surface when the patient's NRS score is ≥ 7.

## Salesforce CMS Setup

1. Create the `zasocitinib_article` content type in CMS using `content-type-definition.json` as the schema reference.
2. Create a CMS Workspace called "Zasocitinib Patient Content".
3. Add content items matching each article JSON.
4. Upload hero images to the CMS workspace media library.
5. CMS content syncs to Data Cloud as catalog DMOs for personalisation targeting.
