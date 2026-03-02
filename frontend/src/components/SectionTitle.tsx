interface Props {
  tag?: string;
  title: string;
  highlight?: string;
  subtitle?: string;
  center?: boolean;
}

export default function SectionTitle({ tag, title, highlight, subtitle, center }: Props) {
  return (
    <div className={`mb-10 ${center ? 'text-center' : ''}`}>
      {tag && (
        <span className="inline-block text-xs font-semibold text-brand-500 uppercase tracking-widest mb-3 bg-brand-50 px-3 py-1 rounded-full">
          {tag}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 leading-tight">
        {title}{' '}
        {highlight && <em className="text-brand-500 not-italic">{highlight}</em>}
      </h2>
      {subtitle && <p className="mt-3 text-gray-500 text-base max-w-xl">{subtitle}</p>}
    </div>
  );
}
