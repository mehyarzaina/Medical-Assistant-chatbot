// Skip Arabic and English titles so "الدكتور عماد المومني" becomes "ع م".
const TITLES = ['الدكتور', 'الدكتورة', 'د', 'د.', 'أخصائي', 'أخصائية', 'اخصائي', 'اخصائية', 'Dr.', 'Dr'];

// The Arabic article "ال" would make every family name start with alef.
function firstLetter(word) {
  const stem = word.startsWith('ال') && word.length > 3 ? word.slice(2) : word;
  return stem[0];
}

export function getInitials(name = '') {
  return name
    .split(' ')
    .filter((w) => w && !TITLES.includes(w))
    .slice(0, 2)
    .map(firstLetter)
    .join(' ');
}
