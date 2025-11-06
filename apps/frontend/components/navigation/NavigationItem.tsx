import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Props = {
  href: string;
  title: string;
  icon: React.ReactNode;
};

export const NavigationItem = ({ href, title, icon }: Props) => {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      className={`rounded-lg p-3 transition-colors hover:cursor-pointer ${
        pathname === href
          ? 'bg-red-100 text-red-700 hover:bg-red-200'
          : 'text-zinc-700 hover:bg-zinc-200'
      }`}
      title={title}
    >
      {icon}
    </Link>
  );
};
