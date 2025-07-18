import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto text-center">
        <p>© {new Date().getFullYear()} HealthConnect. All rights reserved.</p>
        <p className="text-sm text-gray-400 mt-2">Your health is our priority.</p>
      </div>
    </footer>
  );
};

export default Footer;