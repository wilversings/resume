// Runs inside the page: lifts the résumé content out of index.html's DOM so
// the PDF and the site can never disagree about what the résumé says.
// Every selector here is a contract with index.html — see assertComplete.
function extractResume() {
  const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const all = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  // "Kotlin · Java · Groovy" reads as one token to a keyword parser; commas don't.
  const commas = (value) =>
    value
      .split('·')
      .map((part) => part.trim())
      .filter(Boolean);

  const metaValue = (label) => {
    const item = all('.about__meta-item').find(
      (el) => text(el.querySelector('.about__meta-label')) === label
    );
    return text(item && item.querySelector('.about__meta-value'));
  };

  const titleCasePresent = (date) => date.replace(/PRESENT/g, 'Present');

  return {
    name: text(document.querySelector('.site-footer__brand')),
    location: metaValue('Location'),
    education: commas(metaValue('Education')),
    summary: text(document.querySelector('.about__text')),
    contacts: all('.connect__card').map((card) => ({
      label: text(card.querySelector('.connect__label')),
      value: text(card.querySelector('.connect__value')),
      href: card.getAttribute('href'),
    })),
    skills: all('.skills__col').map((col) => ({
      title: text(col.querySelector('.skills__col-title')),
      items: all('.skill-bubble__label', col).map(text),
    })),
    experience: all('.timeline__item').map((item) => ({
      date: titleCasePresent(text(item.querySelector('.timeline__date'))),
      title: text(item.querySelector('.timeline__title')),
      org: text(item.querySelector('.timeline__org')),
      desc: text(item.querySelector('.timeline__desc')),
      points: all('.timeline__points li', item).map(text),
      stack: commas(text(item.querySelector('.timeline__stack'))),
    })),
    projects: all('.portfolio__card').map((card) => ({
      title: text(card.querySelector('.portfolio__title')),
      category: text(card.querySelector('.portfolio__cat')),
      desc: text(card.querySelector('.portfolio__desc')),
      stat: text(card.querySelector('.portfolio__stat')),
      stack: commas(text(card.querySelector('.portfolio__stack'))),
      href: (card.querySelector('.portfolio__link') || {}).href,
    })),
  };
}

module.exports = { extractResume };
