import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const translations = {
  en: {
    // Common
    home: 'Home',
    payments: 'Payments',
    settings: 'Settings',
    logout: 'Logout',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    share: 'Share',
    add: 'Add',
    update: 'Update',
    close: 'Close',
    
    // Dashboard
    dashboard: 'Dashboard',
    summary: 'Summary',
    totalSpent: 'Total Spent',
    totalReceived: 'Total Received',
    currentBalance: 'Current Balance',
    customers: 'Customers',
    addCustomer: 'Add Customer',
    customerName: 'Customer Name',
    mobileNumber: 'Mobile Number',
    noCustomers: 'No customers yet',
    noTransactions: 'No transactions yet',
    
    // Customer Transactions
    currentBalance: 'Current Balance',
    youGave: 'AAPNE DIYE ₹',
    youReceived: 'AAPKO MILE ₹',
    entries: 'ENTRIES',
    balance: 'Bal.',
    addTransaction: 'Add Transaction',
    amount: 'Amount (₹)',
    description: 'Description (Optional)',
    transactionDetails: 'Transaction Details',
    date: 'Date',
    time: 'Time',
    type: 'Type',
    received: 'Received',
    given: 'Given',
    shareTransactionHistory: 'Share Transaction History',
    shareTransactionEntry: 'Share Transaction Entry',
    enterMobileNumber: 'Enter mobile number',
    generateShareLink: 'Generate Share Link',
    
    // Settings
    managePaymentSettings: 'Manage Payment Settings',
    manageMyAccount: 'Manage My Account',
    manageMyCustomers: 'Manage My Customers',
    deleteMyAccount: 'Delete My Account',
    language: 'Language',
    selectLanguage: 'Select Language',
    english: 'English',
    hinglish: 'Hinglish',
    
    // Payments
    paymentHistory: 'Payment History',
    payer: 'Payer',
    method: 'Method',
    proof: 'Proof',
    status: 'Status',
    viewImage: 'View Image',
    noPayments: 'No payments received yet',
    
    // Payment Methods
    paymentMethods: 'Payment Methods',
    addPaymentMethod: 'Add Payment Method',
    upiId: 'UPI ID',
    qrCode: 'QR Code',
    label: 'Label',
    setAsDefault: 'Set as default',
    
    // Account
    name: 'Name',
    phone: 'Phone',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    updateAccount: 'Update Account',
    deleteAccount: 'Delete Account',
    enterPasswordToDelete: 'Enter your password to confirm account deletion'
  },
  hi: {
    // Common
    home: 'होम',
    payments: 'पेमेंट्स',
    settings: 'सेटिंग्स',
    logout: 'लॉगआउट',
    save: 'सेव',
    cancel: 'कैंसल',
    delete: 'डिलीट',
    edit: 'एडिट',
    share: 'शेयर',
    add: 'ऐड',
    update: 'अपडेट',
    close: 'क्लोज',
    
    // Dashboard
    dashboard: 'डैशबोर्ड',
    summary: 'सारांश',
    totalSpent: 'टोटल खर्च',
    totalReceived: 'टोटल मिला',
    currentBalance: 'करंट बैलेंस',
    customers: 'कस्टमर्स',
    addCustomer: 'कस्टमर ऐड करें',
    customerName: 'कस्टमर का नाम',
    mobileNumber: 'मोबाइल नंबर',
    noCustomers: 'अभी कोई कस्टमर नहीं',
    noTransactions: 'अभी कोई ट्रांजैक्शन नहीं',
    
    // Customer Transactions
    currentBalance: 'करंट बैलेंस',
    youGave: 'आपने दिए ₹',
    youReceived: 'आपको मिले ₹',
    entries: 'एंट्रीज',
    balance: 'बैलेंस',
    addTransaction: 'ट्रांजैक्शन ऐड करें',
    amount: 'रकम (₹)',
    description: 'विवरण (ऑप्शनल)',
    transactionDetails: 'ट्रांजैक्शन डिटेल्स',
    date: 'तारीख',
    time: 'टाइम',
    type: 'टाइप',
    received: 'मिला',
    given: 'दिया',
    shareTransactionHistory: 'ट्रांजैक्शन हिस्ट्री शेयर करें',
    shareTransactionEntry: 'ट्रांजैक्शन एंट्री शेयर करें',
    enterMobileNumber: 'मोबाइल नंबर डालें',
    generateShareLink: 'शेयर लिंक बनाएं',
    
    // Settings
    managePaymentSettings: 'पेमेंट सेटिंग्स मैनेज करें',
    manageMyAccount: 'मेरा अकाउंट मैनेज करें',
    manageMyCustomers: 'मेरे कस्टमर्स मैनेज करें',
    deleteMyAccount: 'मेरा अकाउंट डिलीट करें',
    language: 'भाषा',
    selectLanguage: 'भाषा चुनें',
    english: 'अंग्रेजी',
    hinglish: 'हिंग्लिश',
    
    // Payments
    paymentHistory: 'पेमेंट हिस्ट्री',
    payer: 'पेयर',
    method: 'मेथड',
    proof: 'प्रूफ',
    status: 'स्टेटस',
    viewImage: 'इमेज देखें',
    noPayments: 'अभी कोई पेमेंट नहीं मिला',
    
    // Payment Methods
    paymentMethods: 'पेमेंट मेथड्स',
    addPaymentMethod: 'पेमेंट मेथड ऐड करें',
    upiId: 'UPI ID',
    qrCode: 'QR कोड',
    label: 'लेबल',
    setAsDefault: 'डिफॉल्ट सेट करें',
    
    // Account
    name: 'नाम',
    phone: 'फोन',
    email: 'ईमेल',
    password: 'पासवर्ड',
    confirmPassword: 'पासवर्ड कन्फर्म करें',
    updateAccount: 'अकाउंट अपडेट करें',
    deleteAccount: 'अकाउंट डिलीट करें',
    enterPasswordToDelete: 'अकाउंट डिलीट करने के लिए पासवर्ड डालें'
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

