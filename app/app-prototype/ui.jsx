// =============================================================================
// 6ix Back Volleyball → UI Primitives
// =============================================================================
//
// Component API mirrors shadcn/ui (Button, Input, Select, Dialog, Tabs, Badge,
// Card, Checkbox, Label) so anything written here can be ported directly to a
// shadcn-based Next.js app by swapping imports.
//
// Skin commits to the brand: hard 2px ink borders, 6–8px radii, 2-2 brutalist
// shadow, no soft drop shadows. shadcn variants (variant="default|outline|...")
// are honored so prop signatures match.
//
// Exports to window:
//   Button, Input, Textarea, Label, Field
//   Select, SelectTrigger, SelectValue, SelectContent, SelectItem
//   Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
//   Tabs, TabsList, TabsTrigger, TabsContent
//   Badge, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
//   Checkbox, Switch, RadioGroup, RadioGroupItem
//   Separator, Skeleton, Toast/useToast (lightweight)
// =============================================================================

const { useState, useEffect, useRef, useId, useContext, createContext, useCallback, useMemo } = React;

// --------------------------------------------------------------------------
// cn → minimal className combiner
// --------------------------------------------------------------------------
const cn = (...parts) => parts.filter(Boolean).join(' ');

// --------------------------------------------------------------------------
// Button
//   variants: default | accent | outline | ghost | destructive | link
//   sizes: sm | default | lg | icon
// --------------------------------------------------------------------------
function Button({ variant = 'default', size = 'default', className = '', children, asChild, ...rest }) {
  const v = {
    default:     'btn',
    accent:      'btn accent',
    outline:     'btn ghost',
    ghost:       'btn ghost no-shadow',
    destructive: 'btn destructive',
    link:        'btn link',
    invert:      'btn invert',
  }[variant] || 'btn';
  const s = { sm: 'sm', lg: 'lg', xs: 'xs', icon: 'btn-icon', default: '' }[size] || '';
  return <button className={cn(v, s, className)} {...rest}>{children}</button>;
}

// --------------------------------------------------------------------------
// Label
// --------------------------------------------------------------------------
function Label({ className = '', children, ...rest }) {
  return <label className={cn('ui-label', className)} {...rest}>{children}</label>;
}

// --------------------------------------------------------------------------
// Input / Textarea
// --------------------------------------------------------------------------
function Input({ className = '', size, ...rest }) {
  return <input className={cn('input', size === 'sm' && 'sm', className)} {...rest} />;
}
function Textarea({ className = '', rows = 4, ...rest }) {
  return <textarea className={cn('input', className)} rows={rows} {...rest} />;
}

// --------------------------------------------------------------------------
// Field → Label + control + hint, the convenience wrapper most forms use
// --------------------------------------------------------------------------
function Field({ label, hint, error, children, className = '' }) {
  return (
    <div className={cn('ui-field', className)}>
      {label && <Label>{label}</Label>}
      {children}
      {(hint || error) && <div className={cn('ui-hint', error && 'is-error')}>{error || hint}</div>}
    </div>
  );
}

// --------------------------------------------------------------------------
// Select → composed pieces, headless-style. Custom popover (no native select).
// --------------------------------------------------------------------------
const SelectCtx = createContext(null);

function Select({ value, defaultValue, onValueChange, disabled, children }) {
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(defaultValue ?? '');
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;
  const setVal = (v) => {
    if (!isControlled) setInternal(v);
    onValueChange && onValueChange(v);
    setOpen(false);
  };
  const triggerRef = useRef(null);
  const items = useRef(new Map());
  const register = (val, label) => items.current.set(val, label);
  const ctx = { open, setOpen, value: current, setValue: setVal, disabled, triggerRef, register, items };
  return <SelectCtx.Provider value={ctx}>{children}</SelectCtx.Provider>;
}

function SelectTrigger({ className = '', children, ...rest }) {
  const ctx = useContext(SelectCtx);
  return (
    <button ref={ctx.triggerRef} type="button"
      onClick={() => !ctx.disabled && ctx.setOpen(!ctx.open)}
      className={cn('ui-select-trigger', ctx.open && 'is-open', className)}
      aria-expanded={ctx.open} aria-haspopup="listbox" disabled={ctx.disabled} {...rest}>
      <span className="ui-select-value">{children}</span>
      <span className="ui-select-caret" aria-hidden>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </span>
    </button>
  );
}

function SelectValue({ placeholder }) {
  const ctx = useContext(SelectCtx);
  const label = ctx.items.current.get(ctx.value);
  if (label != null && label !== '') return <>{label}</>;
  return <span className="ui-select-placeholder">{placeholder || 'Select…'}</span>;
}

function SelectContent({ className = '', children, align = 'start' }) {
  const ctx = useContext(SelectCtx);
  const popRef = useRef(null);
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!ctx.open) return;
    const place = () => {
      const el = ctx.triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left, width: r.width });
    };
    place();
    const onDoc = (e) => {
      if (popRef.current && !popRef.current.contains(e.target) && !ctx.triggerRef.current.contains(e.target)) {
        ctx.setOpen(false);
      }
    };
    const onKey = (e) => { if (e.key === 'Escape') ctx.setOpen(false); };
    window.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [ctx.open]);

  if (!ctx.open || !pos) return null;
  return ReactDOM.createPortal(
    <div ref={popRef} className={cn('ui-select-content', className)}
         style={{ position: 'fixed', top: pos.top, left: align === 'end' ? pos.left + pos.width : pos.left, minWidth: pos.width, maxWidth: 360, zIndex: 9999 }}
         role="listbox">
      {children}
    </div>,
    document.body
  );
}

function SelectItem({ value, children, disabled }) {
  const ctx = useContext(SelectCtx);
  ctx.register(value, children);
  const selected = ctx.value === value;
  return (
    <div role="option" aria-selected={selected}
         className={cn('ui-select-item', selected && 'is-selected', disabled && 'is-disabled')}
         onClick={() => !disabled && ctx.setValue(value)}>
      <span className="ui-select-item-check" aria-hidden>
        {selected && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
            <path d="M5 12l5 5 9-12"/>
          </svg>
        )}
      </span>
      <span className="ui-select-item-label">{children}</span>
    </div>
  );
}

// Sugar: <NativeSelect> for tiny inline use. NOT shadcn but useful for simple cases.
function NativeSelect({ value, onValueChange, options, className, ...rest }) {
  return (
    <select className={cn('input', className)} value={value} onChange={(e) => onValueChange(e.target.value)} {...rest}>
      {options.map(o => {
        const v = typeof o === 'object' ? o.value : o;
        const l = typeof o === 'object' ? o.label : o;
        return <option key={v} value={v}>{l}</option>;
      })}
    </select>
  );
}

// --------------------------------------------------------------------------
// Dialog → controlled modal with backdrop + portal
// --------------------------------------------------------------------------
const DialogCtx = createContext(null);

function Dialog({ open: openProp, defaultOpen = false, onOpenChange, children }) {
  const [internal, setInternal] = useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internal;
  const setOpen = (v) => {
    if (!isControlled) setInternal(v);
    onOpenChange && onOpenChange(v);
  };
  return <DialogCtx.Provider value={{ open, setOpen }}>{children}</DialogCtx.Provider>;
}

function DialogTrigger({ children, asChild }) {
  const ctx = useContext(DialogCtx);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { onClick: (e) => { children.props.onClick && children.props.onClick(e); ctx.setOpen(true); } });
  }
  return <button className="btn" onClick={() => ctx.setOpen(true)}>{children}</button>;
}

function DialogContent({ className = '', size = 'default', children, hideClose }) {
  const ctx = useContext(DialogCtx);
  useEffect(() => {
    if (!ctx.open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') ctx.setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [ctx.open]);
  if (!ctx.open) return null;
  return ReactDOM.createPortal(
    <div className="ui-dialog-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) ctx.setOpen(false); }}>
      <div className={cn('ui-dialog', `ui-dialog-${size}`, className)} role="dialog" aria-modal="true">
        {!hideClose && (
          <button className="ui-dialog-x" onClick={() => ctx.setOpen(false)} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square"><path d="M6 6l12 12M6 18L18 6"/></svg>
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}

function DialogHeader({ className = '', children }) { return <div className={cn('ui-dialog-header', className)}>{children}</div>; }
function DialogTitle({ className = '', children }) { return <h2 className={cn('ui-dialog-title display', className)}>{children}</h2>; }
function DialogDescription({ className = '', children }) { return <p className={cn('ui-dialog-desc', className)}>{children}</p>; }
function DialogFooter({ className = '', children }) { return <div className={cn('ui-dialog-footer', className)}>{children}</div>; }
function DialogClose({ children = 'Close', className = '', ...rest }) {
  const ctx = useContext(DialogCtx);
  return <button className={cn('btn ghost', className)} onClick={() => ctx.setOpen(false)} {...rest}>{children}</button>;
}

// --------------------------------------------------------------------------
// Tabs
// --------------------------------------------------------------------------
const TabsCtx = createContext(null);
function Tabs({ value: vp, defaultValue, onValueChange, children, className = '' }) {
  const [internal, setInternal] = useState(defaultValue);
  const isC = vp !== undefined;
  const value = isC ? vp : internal;
  const setValue = (v) => { if (!isC) setInternal(v); onValueChange && onValueChange(v); };
  return <TabsCtx.Provider value={{ value, setValue }}><div className={cn('ui-tabs', className)}>{children}</div></TabsCtx.Provider>;
}
function TabsList({ className = '', children }) { return <div className={cn('ui-tabs-list', className)} role="tablist">{children}</div>; }
function TabsTrigger({ value, children, className = '' }) {
  const ctx = useContext(TabsCtx);
  const active = ctx.value === value;
  return (
    <button role="tab" aria-selected={active}
      className={cn('ui-tabs-trigger', active && 'is-active', className)}
      onClick={() => ctx.setValue(value)}>{children}</button>
  );
}
function TabsContent({ value, children, className = '' }) {
  const ctx = useContext(TabsCtx);
  if (ctx.value !== value) return null;
  return <div className={cn('ui-tabs-content', className)} role="tabpanel">{children}</div>;
}

// --------------------------------------------------------------------------
// Badge
// --------------------------------------------------------------------------
function Badge({ variant = 'default', className = '', children, ...rest }) {
  const v = { default: 'ui-badge', accent: 'ui-badge accent', outline: 'ui-badge outline', dark: 'ui-badge dark', destructive: 'ui-badge destructive', success: 'ui-badge success' }[variant] || 'ui-badge';
  return <span className={cn(v, className)} {...rest}>{children}</span>;
}

// --------------------------------------------------------------------------
// Card pieces → composable
// --------------------------------------------------------------------------
function UICard({ className = '', children, variant, ...rest }) {
  const v = variant ? `card ${variant}` : 'card';
  return <div className={cn(v, className)} {...rest}>{children}</div>;
}
function CardHeader({ className = '', children }) { return <div className={cn('ui-card-header', className)}>{children}</div>; }
function CardTitle({ className = '', children }) { return <div className={cn('ui-card-title display', className)}>{children}</div>; }
function CardDescription({ className = '', children }) { return <div className={cn('ui-card-desc', className)}>{children}</div>; }
function CardContent({ className = '', children }) { return <div className={cn('ui-card-content', className)}>{children}</div>; }
function CardFooter({ className = '', children }) { return <div className={cn('ui-card-footer', className)}>{children}</div>; }

// --------------------------------------------------------------------------
// Checkbox
// --------------------------------------------------------------------------
function Checkbox({ checked, defaultChecked, onCheckedChange, disabled, className = '', id, ...rest }) {
  const [internal, setInternal] = useState(!!defaultChecked);
  const isC = checked !== undefined;
  const c = isC ? checked : internal;
  const toggle = () => {
    if (disabled) return;
    if (!isC) setInternal(!c);
    onCheckedChange && onCheckedChange(!c);
  };
  return (
    <button id={id} type="button" role="checkbox" aria-checked={c} disabled={disabled}
      onClick={toggle}
      className={cn('ui-checkbox', c && 'is-checked', className)} {...rest}>
      {c && (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="square"><path d="M5 12l5 5 9-12"/></svg>
      )}
    </button>
  );
}

// --------------------------------------------------------------------------
// Switch
// --------------------------------------------------------------------------
function Switch({ checked, defaultChecked, onCheckedChange, disabled, className = '', id }) {
  const [internal, setInternal] = useState(!!defaultChecked);
  const isC = checked !== undefined;
  const c = isC ? checked : internal;
  const toggle = () => {
    if (disabled) return;
    if (!isC) setInternal(!c);
    onCheckedChange && onCheckedChange(!c);
  };
  return (
    <button id={id} type="button" role="switch" aria-checked={c} disabled={disabled}
      onClick={toggle} className={cn('ui-switch', c && 'is-on', className)}>
      <span className="ui-switch-thumb"/>
    </button>
  );
}

// --------------------------------------------------------------------------
// RadioGroup
// --------------------------------------------------------------------------
const RadioCtx = createContext(null);
function RadioGroup({ value, defaultValue, onValueChange, className = '', children }) {
  const [internal, setInternal] = useState(defaultValue);
  const isC = value !== undefined;
  const v = isC ? value : internal;
  const setV = (x) => { if (!isC) setInternal(x); onValueChange && onValueChange(x); };
  return <RadioCtx.Provider value={{ value: v, setValue: setV }}><div className={cn('ui-radio-group', className)} role="radiogroup">{children}</div></RadioCtx.Provider>;
}
function RadioGroupItem({ value, children, className = '' }) {
  const ctx = useContext(RadioCtx);
  const c = ctx.value === value;
  return (
    <label className={cn('ui-radio-item', c && 'is-checked', className)}>
      <button type="button" role="radio" aria-checked={c} className="ui-radio-dot" onClick={() => ctx.setValue(value)}>
        {c && <span className="ui-radio-fill"/>}
      </button>
      <span>{children}</span>
    </label>
  );
}

// --------------------------------------------------------------------------
// Separator + Skeleton
// --------------------------------------------------------------------------
function Separator({ orientation = 'horizontal', className = '' }) {
  return <div className={cn('ui-separator', `ui-separator-${orientation}`, className)} role="separator"/>;
}
function Skeleton({ className = '' }) { return <div className={cn('ui-skeleton', className)}/>; }

// --------------------------------------------------------------------------
// Toast → minimal pub/sub. <Toaster/> at root, useToast() to fire.
// --------------------------------------------------------------------------
const _toastListeners = new Set();
let _toastId = 0;
function useToast() {
  return useMemo(() => ({
    toast: ({ title, description, variant = 'default', duration = 3500 }) => {
      const id = ++_toastId;
      _toastListeners.forEach(fn => fn({ type: 'add', toast: { id, title, description, variant, duration } }));
      setTimeout(() => _toastListeners.forEach(fn => fn({ type: 'remove', id })), duration);
    },
  }), []);
}
function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const fn = (msg) => {
      if (msg.type === 'add') setItems(s => [...s, msg.toast]);
      else setItems(s => s.filter(t => t.id !== msg.id));
    };
    _toastListeners.add(fn);
    return () => _toastListeners.delete(fn);
  }, []);
  return ReactDOM.createPortal(
    <div className="ui-toaster">
      {items.map(t => (
        <div key={t.id} className={cn('ui-toast', `is-${t.variant}`)}>
          {t.title && <div className="ui-toast-title">{t.title}</div>}
          {t.description && <div className="ui-toast-desc">{t.description}</div>}
        </div>
      ))}
    </div>,
    document.body
  );
}

// --------------------------------------------------------------------------
// Export to window
// --------------------------------------------------------------------------
Object.assign(window, {
  Button, Input, Textarea, Label, Field,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem, NativeSelect,
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Badge,
  UICard, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Checkbox, Switch, RadioGroup, RadioGroupItem,
  Separator, Skeleton,
  Toaster, useToast,
});
