// Lucide icon helper → renders SVG icons by name from the Lucide UMD bundle
function Icon({ name, size = 16, color, strokeWidth = 2, style, className }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!ref.current || !window.lucide) return;
    const lib = window.lucide;
    // lucide.icons map: kebab-case keys with [tag, attrs, children] tuples in newer builds; createIcons replaces data-attrs
    const el = ref.current;
    el.innerHTML = '';
    const tmp = document.createElement('i');
    tmp.setAttribute('data-lucide', name);
    el.appendChild(tmp);
    try { lib.createIcons({ icons: lib.icons, attrs: { width: size, height: size, 'stroke-width': strokeWidth } }); } catch(e){}
    // ensure stroke color via CSS
  }, [name, size, strokeWidth]);
  return (
    <span ref={ref} className={className}
      style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', color: color||'currentColor', width:size, height:size, lineHeight:0, flexShrink:0, ...style }}
      aria-hidden="true"
    />
  );
}
window.Icon = Icon;
