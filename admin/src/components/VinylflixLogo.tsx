import React from 'react';

interface VinylflixLogoProps {
  className?: string;
  size?: number | string;
}

export const VinylflixLogo: React.FC<VinylflixLogoProps> = ({ className = 'w-8 h-8', size }) => {
  return (
    <svg
      width={size || '100%'}
      height={size || '100%'}
      viewBox="0 0 57 55"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M13.92 0C15.756 0 17.3745 1.18218 17.9002 2.90755L24.5459 24.7225C25.7282 28.6032 31.3332 28.5979 32.508 24.715L39.1039 2.91511C39.627 1.18605 41.2468 6.97827e-05 43.0857 0H52.8428C55.6807 0 57.6832 2.72909 56.7816 5.36831L40.7772 52.2202C40.2099 53.8807 38.6243 55 36.8387 55H20.1613C18.3757 55 16.7897 53.8808 16.2224 52.2202L0.218365 5.36831C-0.683165 2.72909 1.31931 0 4.15722 0H13.92Z"
        fill="url(#admin_vinylflix_linear_0)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M28.7075 4.88889C29.6252 4.88889 30.369 5.61847 30.369 6.51852C30.369 7.41856 29.6252 8.14815 28.7075 8.14815C27.7899 8.14807 27.046 7.41851 27.046 6.51852C27.046 5.61852 27.7899 4.88897 28.7075 4.88889ZM28.7075 6.02955C28.5753 6.02959 28.4484 6.08113 28.355 6.17278C28.2616 6.26446 28.2094 6.38889 28.2094 6.51852C28.2094 6.64814 28.2616 6.77258 28.355 6.86426C28.4484 6.95591 28.5753 7.00745 28.7075 7.00749C28.8397 7.00749 28.9665 6.9559 29.06 6.86426C29.1535 6.77257 29.206 6.64818 29.206 6.51852C29.206 6.38886 29.1535 6.26446 29.06 6.17278C28.9665 6.08114 28.8397 6.02955 28.7075 6.02955Z"
        fill="url(#admin_vinylflix_linear_1)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M28.7075 0C32.3782 0 35.3536 2.91834 35.3536 6.51852C35.3536 10.1187 32.3782 13.037 28.7075 13.037C25.0369 13.037 22.0613 10.1186 22.0613 6.51852C22.0613 2.91839 25.0369 8.06832e-05 28.7075 0ZM28.7075 3.66667C27.1016 3.66675 25.7998 4.94349 25.7998 6.51852C25.7998 8.09355 27.1016 9.37029 28.7075 9.37037C30.3134 9.37037 31.6152 8.0936 31.6152 6.51852C31.6152 4.94344 30.3134 3.66667 28.7075 3.66667Z"
        fill="url(#admin_vinylflix_linear_2)"
      />
      <defs>
        <linearGradient id="admin_vinylflix_linear_0" x1="28.5" y1="0" x2="28.5" y2="55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF0091" />
          <stop offset="1" stopColor="#360099" />
        </linearGradient>
        <linearGradient id="admin_vinylflix_linear_1" x1="28.5" y1="0" x2="28.5" y2="55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF0091" />
          <stop offset="1" stopColor="#360099" />
        </linearGradient>
        <linearGradient id="admin_vinylflix_linear_2" x1="28.5" y1="0" x2="28.5" y2="55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF0091" />
          <stop offset="1" stopColor="#360099" />
        </linearGradient>
      </defs>
    </svg>
  );
};
