function getLanguage() { 
  //return the profile from stored language (zh,en)
  var  SysLanguage
  wx.getSystemInfo({
    success: function(res) {
      SysLanguage=res.language
    }
  })
  return SysLanguage || 'en'
}; 
function translate() { 
  return require('i18n/' + getLanguage() + '.js').languageMap;
}  
function translateTxt(desc:any) {
  //translation	
  return translate()[desc] || 'no translation';
} 
module.exports = {
  getLanguage: getLanguage,
  _t: translate,
  _: translateTxt 
}