export default function Input({
    label,
    error,
    type = 'text',
    value,
    onChange,
    placeholder,
    required = false,
    className = '',
    ...rest
}) {
    return (
        <div className={className}>
            {label && (
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    {label}{required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}
            <input
                type={type}
                value={value ?? ''}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className={`w-full px-3 py-2.5 text-sm bg-white border ${error ? 'border-red-500' : 'border-slate-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5276]/20 focus:border-[#1a5276] transition`}
                {...rest}
            />
            {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
        </div>
    );
}
