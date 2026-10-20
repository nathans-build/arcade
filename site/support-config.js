// Support page settings (public links only: never paste keys or passwords here).
// Until a tip link or a charity is set, the support button is hidden on the real site
// (the dev site still shows it, with "not set up yet" notes).
window.SUPPORT = {
  // Tip the arcade. Example: { label: "Tip with a card, Apple Pay or Google Pay", url: "https://buy.stripe.com/..." }
  tips: [
    // amounts: suggested tip buttons ({amount} in amountUrl is filled in); featured is highlighted.
    // Venmo can't enforce a minimum, so these only pre-fill the amount and the person can change it.
    // qr: a QR code image (in site/img) for people on a computer to scan with their phone.
    {
      label: "Tip with Venmo (@Tuong-Do-12)",
      url: "https://venmo.com/u/Tuong-Do-12",
      amounts: [3, 5, 10],
      featured: 5,
      amountUrl: "https://venmo.com/?txn=pay&recipients=Tuong-Do-12&amount={amount}&note=Arcade%20tip",
      qr: "img/venmo-qr.png",
      qrNote: "On a computer? Scan with your phone's camera to open @Tuong-Do-12 in Venmo.",
    },
  ],
  // A children's charity people can give to directly (the money goes straight to them).
  // Example: { name: "First Book", url: "https://firstbook.org/donate/", about: "Gets new books to kids in need." }
  charity: {
    name: "No Kid Hungry",
    url: "https://www.nokidhungry.org/donate",
    about: "No Kid Hungry (a campaign of the nonprofit Share Our Strength) works to end childhood hunger in America, helping kids get the meals they need to learn and play.",
  },
};
