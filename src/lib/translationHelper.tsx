/**
 * Uses Google Translate's free public endpoint to translate text without API keys.
 * This should ONLY be used in the Admin dashboard for translating messages manually via the "Magic" button.
 */
export async function translateText(text: string, targetLang: 'en' | 'zh-CN'): Promise<string> {
  if (!text.trim()) return '';
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=id&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Translation failed');
    const data = await response.json();
    // data[0] contains array of sentences
    let translation = '';
    if (data && data[0]) {
      data[0].forEach((item: any) => {
        if (item[0]) translation += item[0];
      });
    }
    return translation;
  } catch (err) {
    console.error('Translation error:', err);
    throw err;
  }
}
