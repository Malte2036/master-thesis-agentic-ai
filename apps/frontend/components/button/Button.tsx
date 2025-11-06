type Props = {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
};

export const Button = ({ children, onClick, disabled }: Props) => {
  return (
    <button
      className="rounded-lg p-3 transition-colors hover:cursor-pointer bg-red-600 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
