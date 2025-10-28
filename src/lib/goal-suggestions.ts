export interface GoalSuggestion {
  key: string;              // e.g., 'open_house'
  label: string;            // e.g., 'Promote an Open House'
  vertical: string;         // e.g., 'real_estate'

  // Pre-populated campaign copy
  defaultHeadline: string;  // Main headline
  headlineOptions: string[];  // Alternative headlines

  defaultSubheadline: string;  // Supporting text
  subheadlineOptions: string[];  // Alternative subheadlines

  defaultCTA: string;       // Call-to-action button text
  ctaOptions: string[];     // Alternative CTAs

  // Guidance
  description: string;      // What this campaign type is for
  tips: string[];          // Helpful tips for this goal
  exampleAddress?: string;  // Optional example address format
}

/**
 * Complete database of goal-specific campaign suggestions
 */
export const GOAL_SUGGESTIONS: Record<string, GoalSuggestion> = {
  // ===================
  // REAL ESTATE
  // ===================

  'open_house': {
    key: 'open_house',
    label: 'Promote an Open House',
    vertical: 'real_estate',
    defaultHeadline: 'Join Us for an Exclusive Open House',
    headlineOptions: [
      'Open House This Weekend',
      'Tour Your Dream Home',
      'You\'re Invited: Open House Event',
      'See This Home Before It\'s Gone',
    ],
    defaultSubheadline: 'Tour this beautiful property and discover your next home',
    subheadlineOptions: [
      'Light refreshments will be served',
      'See all the amazing features this home has to offer',
      'Perfect opportunity to envision your future',
      'Bring your questions – we\'ll have answers',
    ],
    defaultCTA: 'RSVP Now',
    ctaOptions: ['Reserve Your Spot', 'Get Directions', 'Learn More', 'Schedule Tour'],
    description: 'Drive attendance to an open house event',
    tips: [
      'Include exact date and time in your campaign details',
      'Highlight unique property features',
      'Consider offering light refreshments to attract visitors',
      'Send reminders 1-2 days before the event',
    ],
    exampleAddress: '123 Main Street, Springfield',
  },

  'new_listing': {
    key: 'new_listing',
    label: 'Announce a New Listing',
    vertical: 'real_estate',
    defaultHeadline: 'Just Listed: Your Dream Home Awaits',
    headlineOptions: [
      'New on the Market',
      'Fresh Listing Alert',
      'Be the First to See This Gem',
      'Exciting New Property Available',
    ],
    defaultSubheadline: 'Don\'t miss this opportunity to own a stunning property',
    subheadlineOptions: [
      'Schedule a private showing today',
      'Contact us for exclusive details',
      'Prime location, unbeatable features',
      'The home you\'ve been waiting for',
    ],
    defaultCTA: 'Schedule Showing',
    ctaOptions: ['View Details', 'Contact Agent', 'Get Info', 'Book Tour'],
    description: 'Announce a newly available property listing',
    tips: [
      'Post as soon as listing goes live to capture early interest',
      'Include key stats: beds, baths, sq ft, price',
      'Highlight neighborhood amenities',
      'Use your best professional photos',
    ],
  },

  'referrals': {
    key: 'referrals',
    label: 'Generate Referrals',
    vertical: 'real_estate',
    defaultHeadline: 'Know Someone Looking to Buy or Sell?',
    headlineOptions: [
      'Refer a Friend, Get Rewarded',
      'Your Referrals Mean the World',
      'Help Your Friends Find Their Dream Home',
      'Spread the Word, Earn Rewards',
    ],
    defaultSubheadline: 'Refer your friends and family to our trusted real estate services',
    subheadlineOptions: [
      'We appreciate your trust and confidence',
      'The highest compliment is a referral',
      'Help someone you know make the right move',
      'Earn rewards for successful referrals',
    ],
    defaultCTA: 'Refer Now',
    ctaOptions: ['Send Referral', 'Learn More', 'Get Details', 'Contact Us'],
    description: 'Encourage past clients to refer new business',
    tips: [
      'Consider offering incentives for referrals',
      'Keep message friendly and non-pushy',
      'Remind clients of your excellent service',
      'Make the referral process easy',
    ],
  },

  'new_clients': {
    key: 'new_clients',
    label: 'Attract New Clients',
    vertical: 'real_estate',
    defaultHeadline: 'Ready to Buy or Sell? Let\'s Talk',
    headlineOptions: [
      'Your Real Estate Partner',
      'Let\'s Make Your Move Seamless',
      'Expert Guidance for Your Next Chapter',
      'Local Expertise, Personal Service',
    ],
    defaultSubheadline: 'Experience personalized service from a trusted local expert',
    subheadlineOptions: [
      'Proven track record of success',
      'Making real estate simple and stress-free',
      'Your goals are our priority',
      'Exceptional service, every step of the way',
    ],
    defaultCTA: 'Get Started',
    ctaOptions: ['Contact Us', 'Schedule Consultation', 'Learn More', 'Call Today'],
    description: 'Introduce your services to potential new clients',
    tips: [
      'Highlight your unique value proposition',
      'Include testimonials or success stories',
      'Showcase local market knowledge',
      'Make it easy to get in touch',
    ],
  },

  // ===================
  // PET SERVICES
  // ===================

  'new_service': {
    key: 'new_service',
    label: 'Promote a New Service',
    vertical: 'pet_services',
    defaultHeadline: 'Introducing Our Latest Service for Your Furry Friend',
    headlineOptions: [
      'New Service Alert for Pet Parents',
      'Something Special for Your Pet',
      'We\'ve Added a New Service You\'ll Love',
      'More Ways to Care for Your Pet',
    ],
    defaultSubheadline: 'Discover how we can make your pet even happier',
    subheadlineOptions: [
      'Because your pet deserves the best',
      'Professional care with a personal touch',
      'Book now and see the difference',
      'Limited-time introductory pricing available',
    ],
    defaultCTA: 'Book Now',
    ctaOptions: ['Learn More', 'Schedule Service', 'Get Details', 'Try It Out'],
    description: 'Announce a new pet service offering',
    tips: [
      'Explain what makes this service unique',
      'Consider offering introductory discount',
      'Show before/after photos if applicable',
      'Highlight health/happiness benefits for pets',
    ],
  },

  'seasonal_special': {
    key: 'seasonal_special',
    label: 'Promote a Seasonal Special',
    vertical: 'pet_services',
    defaultHeadline: 'Limited-Time Special for Your Pet',
    headlineOptions: [
      'Seasonal Savings on Pet Care',
      'Pamper Your Pet This Season',
      'Special Offer – Don\'t Miss Out',
      'Your Pet Deserves a Seasonal Treat',
    ],
    defaultSubheadline: 'Book now and give your pet the care they deserve',
    subheadlineOptions: [
      'Available for a limited time only',
      'Quality care at a special price',
      'Spots filling up fast',
      'Show your pet some extra love',
    ],
    defaultCTA: 'Book Today',
    ctaOptions: ['Reserve Spot', 'Get Offer', 'Schedule Now', 'Learn More'],
    description: 'Promote seasonal or limited-time pet service offers',
    tips: [
      'Create urgency with expiration dates',
      'Tie to relevant season (summer grooming, winter boarding)',
      'Show specific discount amount or percentage',
      'Include terms clearly',
    ],
  },

  'pet_referrals': {
    key: 'pet_referrals',
    label: 'Request Referrals',
    vertical: 'pet_services',
    defaultHeadline: 'Love Our Service? Spread the Word!',
    headlineOptions: [
      'Refer a Friend, Both Pets Win',
      'Share the Love with Fellow Pet Parents',
      'Your Referrals Help Us Grow',
      'Know Someone Who Needs Pet Care?',
    ],
    defaultSubheadline: 'Refer your friends and we\'ll thank you both',
    subheadlineOptions: [
      'Both you and your friend get a special discount',
      'Help your fellow pet parents discover great care',
      'The best compliment is a referral',
      'Share your positive experience',
    ],
    defaultCTA: 'Refer a Friend',
    ctaOptions: ['Send Referral', 'Learn More', 'Get Reward', 'Share Now'],
    description: 'Encourage current clients to refer new customers',
    tips: [
      'Clearly state referral rewards for both parties',
      'Make referral process simple',
      'Show appreciation for loyalty',
      'Include referral link or code',
    ],
  },

  // ===================
  // HOME SERVICES
  // ===================

  'seasonal_maintenance': {
    key: 'seasonal_maintenance',
    label: 'Seasonal Maintenance Reminder',
    vertical: 'home_services',
    defaultHeadline: 'Time for Your Seasonal Home Maintenance',
    headlineOptions: [
      'Prepare Your Home for the Season',
      'Don\'t Skip Your Seasonal Checkup',
      'Keep Your Home in Top Shape',
      'Seasonal Service Reminder',
    ],
    defaultSubheadline: 'Schedule your maintenance service before it\'s too late',
    subheadlineOptions: [
      'Prevent costly repairs with regular maintenance',
      'Our experts are ready to help',
      'Book early for best availability',
      'Protect your home year-round',
    ],
    defaultCTA: 'Schedule Service',
    ctaOptions: ['Book Now', 'Get Quote', 'Contact Us', 'Learn More'],
    description: 'Remind customers about seasonal home maintenance',
    tips: [
      'Time campaigns to relevant seasons',
      'List specific maintenance tasks included',
      'Emphasize prevention over reaction',
      'Offer package deals for multiple services',
    ],
  },

  'special_offer': {
    key: 'special_offer',
    label: 'Promote Special Offer',
    vertical: 'home_services',
    defaultHeadline: 'Limited-Time Offer on Home Services',
    headlineOptions: [
      'Special Savings This Month',
      'Don\'t Miss This Deal',
      'Exclusive Offer for Homeowners',
      'Save Big on Home Services',
    ],
    defaultSubheadline: 'Quality service at an unbeatable price – book today',
    subheadlineOptions: [
      'Offer ends soon',
      'Professional work, discounted rate',
      'Limited spots available',
      'Your home deserves the best',
    ],
    defaultCTA: 'Get Offer',
    ctaOptions: ['Book Now', 'Call Today', 'Schedule Service', 'Learn More'],
    description: 'Promote limited-time service offers and discounts',
    tips: [
      'Show clear discount value',
      'Include expiration date',
      'Specify what services are included',
      'Add testimonials to build trust',
    ],
  },

  'home_referrals': {
    key: 'home_referrals',
    label: 'Request Referrals',
    vertical: 'home_services',
    defaultHeadline: 'Refer a Neighbor, Earn Rewards',
    headlineOptions: [
      'Share Our Services with Friends',
      'Your Referrals Are Appreciated',
      'Help Your Community Find Great Service',
      'Know Someone Who Needs Help?',
    ],
    defaultSubheadline: 'Refer someone and we\'ll thank you both',
    subheadlineOptions: [
      'Both you and your friend get a discount',
      'Building community through quality service',
      'Your trust means everything to us',
      'The best compliment is a referral',
    ],
    defaultCTA: 'Refer Now',
    ctaOptions: ['Send Referral', 'Get Reward', 'Learn More', 'Share'],
    description: 'Encourage customers to refer new business',
    tips: [
      'State referral bonus clearly',
      'Make it easy to refer',
      'Show appreciation for existing clients',
      'Consider tiered rewards for multiple referrals',
    ],
  },

  // ===================
  // LANDSCAPING
  // ===================

  'spring_cleanup': {
    key: 'spring_cleanup',
    label: 'Spring Cleanup Services',
    vertical: 'landscaping',
    defaultHeadline: 'Get Your Yard Ready for Spring',
    headlineOptions: [
      'Spring Cleanup Services Available',
      'Transform Your Yard This Spring',
      'Time for Your Spring Yard Refresh',
      'Make Your Lawn the Envy of the Neighborhood',
    ],
    defaultSubheadline: 'Professional cleanup and preparation for the growing season',
    subheadlineOptions: [
      'Book now for early spring availability',
      'Start the season with a beautiful yard',
      'Expert care for a thriving lawn',
      'Comprehensive cleanup and prep services',
    ],
    defaultCTA: 'Schedule Cleanup',
    ctaOptions: ['Book Now', 'Get Quote', 'Contact Us', 'Learn More'],
    description: 'Promote spring yard cleanup and preparation services',
    tips: [
      'Launch campaign in late winter',
      'List specific services included',
      'Show before/after photos',
      'Offer early bird discount',
    ],
  },

  'lawn_care': {
    key: 'lawn_care',
    label: 'Ongoing Lawn Care',
    vertical: 'landscaping',
    defaultHeadline: 'Keep Your Lawn Looking Great All Season',
    headlineOptions: [
      'Professional Lawn Care Services',
      'Weekly Lawn Care – Hassle Free',
      'Let Us Handle Your Lawn Maintenance',
      'Your Lawn Deserves Expert Care',
    ],
    defaultSubheadline: 'Regular maintenance for a healthy, beautiful lawn',
    subheadlineOptions: [
      'Reliable service you can count on',
      'Flexible scheduling to fit your needs',
      'Expert care, every visit',
      'Sit back and enjoy a perfect lawn',
    ],
    defaultCTA: 'Get Started',
    ctaOptions: ['Schedule Service', 'Get Quote', 'Contact Us', 'Learn More'],
    description: 'Promote recurring lawn care and maintenance packages',
    tips: [
      'Emphasize convenience and consistency',
      'Offer package deals for full-season service',
      'Highlight equipment and expertise',
      'Make sign-up process easy',
    ],
  },

  'snow_removal': {
    key: 'snow_removal',
    label: 'Snow Removal Services',
    vertical: 'landscaping',
    defaultHeadline: 'Don\'t Let Snow Slow You Down',
    headlineOptions: [
      'Professional Snow Removal Services',
      'We\'ll Handle the Snow',
      'Stay Safe with Our Snow Removal',
      'Reliable Snow Plowing and Shoveling',
    ],
    defaultSubheadline: 'Fast, reliable snow removal for your property',
    subheadlineOptions: [
      'Available 24/7 during snow events',
      'Keep your driveway and walkways clear',
      'Book now for winter coverage',
      'Safe access all winter long',
    ],
    defaultCTA: 'Book Service',
    ctaOptions: ['Get Quote', 'Sign Up', 'Contact Us', 'Learn More'],
    description: 'Promote winter snow removal and plowing services',
    tips: [
      'Launch in early fall before first snow',
      'Offer seasonal contracts',
      'Emphasize response time',
      'Show equipment and team',
    ],
  },

  // ===================
  // PROFESSIONAL SERVICES
  // ===================

  'free_consultation': {
    key: 'free_consultation',
    label: 'Offer Free Consultation',
    vertical: 'professional_services',
    defaultHeadline: 'Start with a Free Consultation',
    headlineOptions: [
      'Complimentary Consultation Available',
      'Let\'s Discuss Your Goals',
      'Free Strategy Session',
      'Book Your Free Consultation Today',
    ],
    defaultSubheadline: 'Discover how we can help you achieve your goals',
    subheadlineOptions: [
      'No obligation, just expert advice',
      'Get answers to your questions',
      'Personalized recommendations for your situation',
      'See if we\'re the right fit',
    ],
    defaultCTA: 'Book Consultation',
    ctaOptions: ['Schedule Now', 'Get Started', 'Contact Us', 'Learn More'],
    description: 'Offer free initial consultation to attract new clients',
    tips: [
      'Make booking process simple',
      'Specify duration (e.g., "30-minute")',
      'Clarify what will be covered',
      'Remove barriers to entry',
    ],
  },

  'workshop': {
    key: 'workshop',
    label: 'Promote Workshop or Event',
    vertical: 'professional_services',
    defaultHeadline: 'Join Our Upcoming Workshop',
    headlineOptions: [
      'Learn from the Experts',
      'Register for Our Next Workshop',
      'Don\'t Miss This Learning Opportunity',
      'Workshop: [Topic] – Sign Up Now',
    ],
    defaultSubheadline: 'Gain valuable insights and actionable strategies',
    subheadlineOptions: [
      'Limited seats available',
      'Interactive learning experience',
      'Walk away with practical skills',
      'Network with like-minded professionals',
    ],
    defaultCTA: 'Register Now',
    ctaOptions: ['Save My Spot', 'Learn More', 'Sign Up', 'Get Details'],
    description: 'Promote educational workshops or events',
    tips: [
      'Include date, time, and location/format',
      'Highlight key takeaways',
      'Show instructor credentials',
      'Create urgency with limited seating',
    ],
  },

  'new_program': {
    key: 'new_program',
    label: 'Launch New Program',
    vertical: 'professional_services',
    defaultHeadline: 'Introducing Our New Program',
    headlineOptions: [
      'New Program: Transform Your [Area]',
      'Exciting New Offering',
      'Take Your [Goal] to the Next Level',
      'Our Latest Program Is Here',
    ],
    defaultSubheadline: 'Discover a proven approach to achieving your goals',
    subheadlineOptions: [
      'Limited spots for founding members',
      'Comprehensive support and guidance',
      'Results-driven methodology',
      'Join early for special pricing',
    ],
    defaultCTA: 'Learn More',
    ctaOptions: ['Enroll Now', 'Get Details', 'Apply Today', 'Schedule Call'],
    description: 'Announce and promote a new coaching program or service',
    tips: [
      'Clearly explain what makes it unique',
      'Share success stories or pilot results',
      'Include pricing or investment',
      'Offer early bird incentive',
    ],
  },
};

/**
 * Get suggestion for a specific goal
 */
export function getSuggestion(goal: string): GoalSuggestion | null {
  return GOAL_SUGGESTIONS[goal] || null;
}

/**
 * Get all suggestions for a vertical
 */
export function getSuggestionsByVertical(vertical: string): GoalSuggestion[] {
  return Object.values(GOAL_SUGGESTIONS).filter(s => s.vertical === vertical);
}

/**
 * Get random headline option for variation
 */
export function getRandomHeadline(goal: string): string {
  const suggestion = getSuggestion(goal);
  if (!suggestion) return '';

  const allOptions = [suggestion.defaultHeadline, ...suggestion.headlineOptions];
  return allOptions[Math.floor(Math.random() * allOptions.length)];
}

/**
 * Get random subheadline option for variation
 */
export function getRandomSubheadline(goal: string): string {
  const suggestion = getSuggestion(goal);
  if (!suggestion) return '';

  const allOptions = [suggestion.defaultSubheadline, ...suggestion.subheadlineOptions];
  return allOptions[Math.floor(Math.random() * allOptions.length)];
}
