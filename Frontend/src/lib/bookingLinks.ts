/**
 * Booking deep-links — open the big providers pre-filled with the trip's
 * destination and dates. No affiliate params, just honest handoffs.
 */

export interface BookingContext {
  destination: string | null;
  startDate: string | null; // YYYY-MM-DD
  endDate: string | null;
}

export interface BookingProvider {
  name: string;
  tagline: string;
  url: (ctx: BookingContext) => string;
}

export interface BookingGroup {
  key: 'stays' | 'flights' | 'trains' | 'cars';
  title: string;
  emoji: string;
  providers: BookingProvider[];
}

const enc = encodeURIComponent;
const d = (s: string | null) => s ?? '';

export const BOOKING_GROUPS: BookingGroup[] = [
  {
    key: 'stays',
    title: 'Stays',
    emoji: '🏨',
    providers: [
      {
        name: 'Airbnb',
        tagline: 'Homes & unique stays',
        url: ({ destination, startDate, endDate }) =>
          `https://www.airbnb.com/s/${enc(d(destination) || 'anywhere')}/homes?checkin=${d(startDate)}&checkout=${d(endDate)}`,
      },
      {
        name: 'Booking.com',
        tagline: 'Hotels, apartments & more',
        url: ({ destination, startDate, endDate }) =>
          `https://www.booking.com/searchresults.html?ss=${enc(d(destination))}&checkin=${d(startDate)}&checkout=${d(endDate)}`,
      },
      {
        name: 'Hostelworld',
        tagline: 'Budget hostels',
        url: ({ destination, startDate, endDate }) =>
          `https://www.hostelworld.com/search?search_keywords=${enc(d(destination))}&date_from=${d(startDate)}&date_to=${d(endDate)}`,
      },
    ],
  },
  {
    key: 'flights',
    title: 'Flights',
    emoji: '✈️',
    providers: [
      {
        name: 'Google Flights',
        tagline: 'Compare across airlines',
        url: ({ destination, startDate, endDate }) =>
          `https://www.google.com/travel/flights?q=${enc(`flights to ${d(destination)} ${d(startDate)}${endDate ? ` through ${endDate}` : ''}`)}`,
      },
      {
        name: 'Skyscanner',
        tagline: 'Cheapest fares',
        url: ({ destination }) => `https://www.skyscanner.com/transport/flights-to/${enc(d(destination))}`,
      },
      {
        name: 'Kayak',
        tagline: 'Flexible date search',
        url: ({ destination }) => `https://www.kayak.com/explore/?destination=${enc(d(destination))}`,
      },
    ],
  },
  {
    key: 'trains',
    title: 'Trains & buses',
    emoji: '🚆',
    providers: [
      {
        name: 'Omio',
        tagline: 'Trains, buses & ferries worldwide',
        url: ({ destination }) => `https://www.omio.com/search?arrival=${enc(d(destination))}`,
      },
      {
        name: 'Trainline',
        tagline: 'Europe rail & coach',
        url: ({ destination }) => `https://www.thetrainline.com/?to=${enc(d(destination))}`,
      },
      {
        name: 'Rome2Rio',
        tagline: 'How to get anywhere',
        url: ({ destination }) => `https://www.rome2rio.com/map/anywhere/${enc(d(destination))}`,
      },
    ],
  },
  {
    key: 'cars',
    title: 'Car rental',
    emoji: '🚗',
    providers: [
      {
        name: 'Rentalcars.com',
        tagline: 'Global comparison',
        url: ({ destination }) => `https://www.rentalcars.com/en/searchresults?location=${enc(d(destination))}`,
      },
      {
        name: 'Discover Cars',
        tagline: 'Price comparison',
        url: ({ destination }) => `https://www.discovercars.com/search?location=${enc(d(destination))}`,
      },
      {
        name: 'Kayak Cars',
        tagline: 'Deals & flexible pickup',
        url: ({ destination }) => `https://www.kayak.com/cars/${enc(d(destination))}`,
      },
    ],
  },
];
