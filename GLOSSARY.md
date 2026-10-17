# Danza App

A directory of dance companies where dancers find auditions and read and write reviews.

## Auditions

**Audition**:
A call from a company for dancers to apply and be seen, made of one or more deadlines.
_Avoid_: Casting, open call (that is a status), job offer

**Deadline**:
The last day to apply to an audition for the audition dates that hang from it. Every audition date belongs to exactly one deadline; one deadline can cover several audition dates.
_Avoid_: Closing date, application date

**Audition date**:
A single day or a range of up to 60 days when an audition happens in one place, in person or online.
_Avoid_: Session, slot, stop, round (a round is a note on an audition date)

**Date label**:
Text shown instead of the date of a deadline or an audition date, such as "ASAP" or "To be arranged upon invitation". The date behind it is still real (sometimes an estimate) and is what status and filters use.
_Avoid_: ASAP mode, to be arranged mode

**Schedule label**:
Text that sums up an audition's whole schedule, such as "7 cities · Oct 2026 – Feb 2027". The listing card shows it instead of the deadline and the audition dates; the audition page shows it above them.
_Avoid_: Card summary (an audition's summary is its headline)

**Note**:
Text shown next to a deadline or an audition date without replacing it, such as "Men · 11:00–12:30" or "Second round by invitation".

**Format**:
Whether an audition date is in person (at a place in a country) or online (no country).
_Avoid_: Video audition (as a separate kind)

**Events company**:
A company of type events, such as a festival or gala, that organizes auditions other companies take part in.
_Avoid_: Organizer

**Participating company**:
A company taking part in an audition organized by an events company.
While that audition is live, the participating company's card and page say it is also participating in that event.

**Application link**:
A page where dancers apply to an audition, such as an application form or a video upload. An audition has none or several, in order; the first is its main action. It is not the audition's website, which is where its information lives.
_Avoid_: Website, apply URL

**Contact email**:
An address dancers can write to about an audition. An audition has none or several, in order; each can say what it is for, such as "Applications" or "Questions".
_Avoid_: Email (alone: it could be a user's), audition email

**Age range**:
The ages an audition accepts, in whole years with both bounds included: a minimum ("18+"), a maximum ("up to 25") or both ("18–25"). An audition without one has no age limit.

## Audition status

**Open call**:
An audition with at least one deadline today or later.
_Avoid_: Open, upcoming

**Post-deadline**:
An audition whose deadlines have all passed but that still has an audition date ending today or later.

**Past audition**:
An audition whose deadlines and audition dates have all passed. Past auditions stay visible as a record.
_Avoid_: Closed, expired

**Live audition**:
An active audition that is not a past audition: an open call or post-deadline.
_Avoid_: Upcoming audition (only as the UI filter's label)

**Active audition**:
An audition an admin has not switched off; inactive auditions are hidden from companies' pages.

## Resources

**Resource**:
A school, professional or service around ballet that a dancer can find in the directory: a dance school, a freelance teacher, a photographer, a physiotherapist, a movement studio.
_Avoid_: Listing, provider, business, vendor

**Resource type**:
Which of those a resource is. It decides what the resource is asked for and what it needs before it can go public.
_Avoid_: Category, kind

**Account type**:
Whether an account signed up as a dancer or as a professional. Chosen at sign-up, and what decides which experience the person gets.
_Avoid_: Role (that is admin vs user), user type

**Professional**:
Whoever is in the directory rather than looking for auditions. A professional's whole public profile is their resource, so their account holds nothing but the sign-in.
_Avoid_: Owner, business user, client

**Region**:
One of the areas of a country we offer a resource to choose from. The list is ours; it is never free text.
_Avoid_: Province, state, area, location

**Region scope**:
How wide a resource reaches: one fixed region, several (up to three), or nationwide.
_Avoid_: Coverage, reach, mode

**Placement**:
The position a resource gets in a region, decided by its region scope: a resource with that one fixed region first, then resources with several regions, then nationwide ones.
_Avoid_: Ranking, priority, boost

**Nationwide resource**:
A resource that appears in every region of its country, and always after the resources that chose regions there.
_Avoid_: Global, countrywide

**No fixed address**:
A resource that has no address on purpose, because it travels or works online. It is an answer, not a blank field.

**Draft**:
A resource whose professional is still filling it in. Only they see it, and nothing is required to save it.
_Avoid_: Incomplete, unsaved

**Pending review**:
A resource its professional has sent us and we have not published yet.
_Avoid_: Submitted, applied

**Published resource**:
A resource anyone can find in the directory. Only an admin makes a resource published.

**Hidden resource**:
A resource taken out of the directory, by us or by its own professional.
_Avoid_: Deleted, disabled, archived

**Verified resource**:
A resource we have checked ourselves. Being verified breaks ties between resources with the same placement.
_Avoid_: Approved, trusted, featured

**Onboarding step**:
One of the screens a professional goes through to build their resource: basics, reach, contact, craft, showcase.
_Avoid_: Page, stage, wizard step

**Resource field**:
One of the things the onboarding can ask a resource for. Which ones it is asked, and which of them it needs to go public, depend on its type.
_Avoid_: Attribute, property, question

**Skipped field**:
A field a professional chose to leave for later. Skipping delays publishing; it never waives a requirement.
_Avoid_: Ignored, dismissed

**Logo**:
The single image that identifies a resource across the directory. Not part of its gallery.
_Avoid_: Avatar, main photo, cover

**Gallery**:
The photos of a resource's work. The heart of a photographer's resource, optional for everyone else.
_Avoid_: Portfolio, album, images

**Discipline**:
Something a school or a teacher teaches: ballet, pointe, men's technique, repertoire.
_Avoid_: Style, subject, class type

**Student goal**:
What a school's or a teacher's students are there for: recreational, vocational or professional.
_Avoid_: Level, audience
