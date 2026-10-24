# Danza App

A directory of dance companies where dancers find auditions and read and write reviews.

## Companies

**Company subtype**:
What kind of organization a company is, such as normal, touring, junior, school pro or events. A company has none, one or several, in any combination; none means it is not classified yet.
_Avoid_: Category, tag

**Company type**:
A group of company subtypes, such as Professional companies, Junior and pre-professional, Professional education or Events. It is a heading in the admin form and what the companies filter lists: a company matches a type when it has any subtype under it. It is never assigned to a company: a company has subtypes, not a type.
_Avoid_: Company category

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
A company with the events subtype, such as a festival or gala, that organizes auditions other companies take part in.
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
