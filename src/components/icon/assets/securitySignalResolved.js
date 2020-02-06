import React from 'react';

const EuiIconSecuritySignalResolved = ({ title, titleId, ...props }) => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    aria-labelledby={titleId}
    {...props}>
    {title ? <title id={titleId}>{title}</title> : null}
    <path
      fillRule="evenodd"
      d="M13.657 3.05a.5.5 0 10-.707-.707l-.366.366A7 7 0 108 15a4.994 4.994 0 01-.597-1.03 6 6 0 114.471-10.552l-.71.71a5 5 0 10-4.08 8.788 5.028 5.028 0 01-.082-1.042A4.002 4.002 0 018 4a3.98 3.98 0 012.453.84l-.715.714a3 3 0 00-3.86 4.567.5.5 0 10.708-.707 2 2 0 012.43-3.137l-.757.757a1 1 0 10.707.707l1.155-1.155 2.46-2.46a5.972 5.972 0 011.39 3.277c.367.158.713.36 1.029.597 0-1.636-.57-3.271-1.71-4.584l.367-.366zM16 12a4 4 0 11-8 0 4 4 0 018 0zm-1.646-1.354a.5.5 0 010 .707l-2.5 2.5a.5.5 0 01-.708 0l-1-1a.5.5 0 01.708-.707l.646.647 2.146-2.147a.5.5 0 01.708 0z"
    />
  </svg>
);

export const icon = EuiIconSecuritySignalResolved;
