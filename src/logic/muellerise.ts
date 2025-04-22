const WordsToSkip = ["and", "or", "the", "a", ",", "—"];
const WordsInLowerCase = [
  "against",
  "on",
  "of",
  "about",
  "in",
  "at",
  "as",
  "to",
  "for",
];

export function intoMueller(title: string): string {
  // TODO: remove quotation marks and other special characters
  // Also something needs to be done about several authors, and maybe '-' in the names

  title = title.split(":")[0].replace("-", " ");
  const array = title.split(" ");

  let mTitle = "";
  let mLength = 0;

  for (let current of array) {
    if (mLength == 4) break;

    if (WordsToSkip.includes(current.toLowerCase())) continue;

    current = current.replace("\'", "").replace('"', "").replace("\“", "");

    if (mLength > 0 && WordsInLowerCase.includes(current.toLowerCase()))
      mTitle += current[0].toLowerCase();
    else mTitle += current[0].toUpperCase();

    mLength++;
  }

  return mTitle;
}

export function modifyAuthor(author: string): string {
  author = author.split(" and ")[0].split(" et al.")[0];

  // Ü, ü     \u00dc, \u00fc
  // Ä, ä     \u00c4, \u00e4
  // Ö, ö     \u00d6, \u00f6
  // ß        \u00df

  // const umlaute: Record<string, string> = {'ß':'ss','ö':'oe','ä':'ae','ü':'ue','Ö':'Oe','Ä':'Ae','Ü':'Ue'};

  const umlaute: Record<string, string> = {
    "\u00df": "ss",
    "\u00f6": "oe",
    "\u00e4": "ae",
    "\u00fc": "ue",
    "\u00d6": "Oe",
    "\u00c4": "Ae",
    "\u00dc": "Ue",
  };

  author = author.replace(
    /[\u00dc\u00fc\u00c4\u00e4\u00d6\u00f6\u00df]/g,
    (m) => umlaute[m],
  );

  author = author.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");

  author = author.replace("-", "").replace(" ", "");

  author = author.replace(author[0], author[0].toUpperCase());

  return author;
}
