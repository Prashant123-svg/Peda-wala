import { useState } from "react";
import { Link } from "react-router-dom";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export default function Help() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const faqItems: FAQItem[] = [
    {
      id: 1,
      question: "How do I place an order?",
      answer:
        "Browse our products, add items to your cart, and proceed to checkout. You'll need to log in or sign up to complete your order.",
    },
    {
      id: 2,
      question: "What payment methods do you accept?",
      answer:
        "We accept Credit Cards, Debit Cards, Net Banking, and UPI payments. Enjoy special discounts with card payments!",
    },
    {
      id: 3,
      question: "How long does delivery take?",
      answer:
        "Standard delivery takes 3-5 business days. Express delivery options may be available in select areas. You'll receive a tracking number after your order is confirmed.",
    },
    {
      id: 4,
      question: "Are your products 100% fresh?",
      answer:
        "Yes! All our pedhe are made fresh using pure, traditional recipes with no artificial additives. We prioritize quality and freshness in every batch.",
    },
    {
      id: 5,
      question: "Can I cancel or modify my order?",
      answer:
        "Orders can be cancelled or modified within 2 hours of placement. After that, the order will be in preparation. Contact our support team for assistance.",
    },
    {
      id: 6,
      question: "What is your return/refund policy?",
      answer:
        "We offer a 100% satisfaction guarantee. If you're not happy with your order, contact us within 24 hours of delivery for a full refund or replacement.",
    },
    {
      id: 7,
      question: "Do you offer bulk orders?",
      answer:
        "Yes! We handle corporate gifts and bulk orders. Contact our sales team at support@pedhewala.com or call +91-9999-999-999 for special pricing.",
    },
    {
      id: 8,
      question: "How do I track my order?",
      answer:
        "After your order ships, you'll receive a tracking link via email. You can also check the status in your 'Orders' section in your profile.",
    },
  ];

  return (
    <div className="help-page">
      <div className="w-full min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 py-12">
        <div className="w-full px-4">
          <h1 className="text-4xl font-bold mb-3">Help & Support</h1>
          <p className="text-lg opacity-90">
            Find answers to your questions and get the help you need
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="w-full px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Phone */}
          <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">📞</div>
            <h3 className="text-xl font-bold mb-2">Call Us</h3>
            <p className="text-gray-600 mb-4">
              Available Monday-Saturday, 9 AM - 6 PM
            </p>
            <a
              href="tel:+919999999999"
              className="text-yellow-600 font-bold text-lg hover:underline"
            >
              +91-9999-999-999
            </a>
          </div>

          {/* Email */}
          <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">📧</div>
            <h3 className="text-xl font-bold mb-2">Email Us</h3>
            <p className="text-gray-600 mb-4">
              We'll respond within 24 hours
            </p>
            <a
              href="mailto:support@pedhewala.com"
              className="text-yellow-600 font-bold text-lg hover:underline"
            >
              support@pedhewala.com
            </a>
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">📍</div>
            <h3 className="text-xl font-bold mb-2">Visit Us</h3>
            <p className="text-gray-600">
              Mathura, Uttar Pradesh, India
            </p>
            <p className="text-sm text-gray-500 mt-2">
              By appointment only
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full px-4 pb-12">
        <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>

        <div className="space-y-4">
          {faqItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <button
                onClick={() =>
                  setExpandedId(expandedId === item.id ? null : item.id)
                }
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {item.question}
                </h3>
                <span
                  className={`ml-4 transition-transform duration-300 text-2xl ${
                    expandedId === item.id ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </button>

              {expandedId === item.id && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Still Need Help */}
      <section className="bg-yellow-50 py-12 mb-8">
        <div className="w-full px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Still Need Help?</h2>
          <p className="text-gray-700 mb-6">
            Can't find what you're looking for? Our support team is here to help!
          </p>
          <a
            href="mailto:support@pedhewala.com"
            className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
          >
            Contact Support
          </a>
        </div>
      </section>

      {/* Back to Home */}
      <section className="w-full px-4 pb-12 text-center">
        <Link
          to="/"
          className="text-yellow-600 hover:text-yellow-700 font-semibold text-lg no-underline"
        >
          ← Back to Home
        </Link>
      </section>
      </div>
    </div>
  );
}
