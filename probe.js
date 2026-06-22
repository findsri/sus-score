const cheerio = require('./node_modules/cheerio');
const $ = cheerio.load('<a href="#" style="color:red">unsubscribe</a><footer><a href="#">unsubscribe</a></footer>');
$('a').each(function(i, el) {
  console.log('type:', el.type);
  console.log('keys:', Object.keys(el).join(', '));
  console.log('tagName:', el.tagName || el.name);
  console.log('attribs:', JSON.stringify(el.attribs));
});
