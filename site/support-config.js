// Support page settings (public links only: never paste keys or passwords here).
// Until a tip link or a charity is set, the support button is hidden on the real site
// (the dev site still shows it, with "not set up yet" notes).
window.SUPPORT = {
  // Tip the arcade. Example: { label: "Tip with a card, Apple Pay or Google Pay", url: "https://buy.stripe.com/..." }
  tips: [
    { label: "Tip with Venmo (@nzdogames)", url: "https://www.venmo.com/u/nzdogames" },
  ],
  // A children's charity people can give to directly (the money goes straight to them).
  // Example: { name: "First Book", url: "https://firstbook.org/donate/", about: "Gets new books to kids in need." }
  charity: {
    name: "No Kid Hungry",
    url: "https://www.nokidhungry.org/donate",
    about: "No Kid Hungry (a campaign of the nonprofit Share Our Strength) works to end childhood hunger in America, helping kids get the meals they need to learn and play.",
  },
};
