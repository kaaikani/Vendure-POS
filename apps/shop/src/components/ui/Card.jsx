export default function Card({ children, className = '', hover = false, ...rest }) {
    return (
        <div
            className={`bg-white border border-slate-200 rounded-xl overflow-hidden ${hover ? 'transition hover:shadow-lg hover:border-[#1a5276]/30' : ''} ${className}`}
            {...rest}
        >
            {children}
        </div>
    );
}
