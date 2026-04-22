export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    type = 'button',
    disabled = false,
    onClick,
    className = '',
    ...rest
}) {
    const base = 'inline-flex items-center justify-center gap-2 font-bold transition rounded-lg disabled:opacity-50 disabled:cursor-not-allowed';
    const variants = {
        primary: 'bg-[#1a5276] hover:bg-[#154360] text-white',
        secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300',
        outline: 'bg-transparent border-2 border-[#1a5276] text-[#1a5276] hover:bg-[#1a5276] hover:text-white',
        ghost: 'text-[#1a5276] hover:bg-slate-100',
        danger: 'bg-red-600 hover:bg-red-700 text-white',
    };
    const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };
    return (
        <button
            type={type}
            disabled={disabled}
            onClick={onClick}
            className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
            {...rest}
        >
            {children}
        </button>
    );
}
