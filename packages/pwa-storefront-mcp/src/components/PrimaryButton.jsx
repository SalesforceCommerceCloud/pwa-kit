

const PrimaryButton = ({ children, onClick, disabled = false, className = '', ...props }) => {
  return (
    <button
      className={`bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;