// Audit-owned synthetic page. Empty editable blocks need an explicit hit area.
export const originalSynthetic =
  '<!doctype html><meta charset="utf-8"><title>M14-Q synthetic editor</title><input id="input"><textarea id="textarea"></textarea><div id="rich" contenteditable="true"><p></p></div><div id="shadow"></div><script>document.querySelector("#shadow").attachShadow({mode:"open"}).innerHTML="<div id=inner contenteditable=true><p></p></div>"</script>';
export const synthetic = originalSynthetic
  .replace(
    '<input',
    '<style>[contenteditable] { min-height:32px; min-width:240px; border:1px solid #888 }</style><input',
  )
  .replace(
    '<div id=inner',
    '<style>[contenteditable] { min-height:32px; min-width:240px; border:1px solid #888 }</style><div id=inner',
  );
