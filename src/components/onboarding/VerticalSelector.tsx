import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Home, Dog, Wrench, Leaf, Briefcase } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const iconMap: Record<string, React.ComponentType<any>> = {
  Home,
  Dog,
  Wrench,
  Leaf,
  Briefcase,
};

interface Vertical {
  key: string;
  name: string;
  description: string;
  icon: string;
}

interface VerticalSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const VerticalSelector: React.FC<VerticalSelectorProps> = ({
  value,
  onChange,
}) => {
  const [verticals, setVerticals] = useState<Vertical[]>([]);

  useEffect(() => {
    loadVerticals();
  }, []);

  const loadVerticals = async () => {
    const { data, error } = await supabase
      .from('verticals')
      .select('key, name, description, icon')
      .order('name');

    if (!error && data) {
      setVerticals(data);
    } else {
      // Fallback to hardcoded verticals if database query fails
      setVerticals([
        { key: 'real_estate', name: 'Real Estate', description: 'Agents, brokers, and property managers', icon: 'Home' },
        { key: 'pet_services', name: 'Pet Services', description: 'Dog walking, pet sitting, grooming', icon: 'Dog' },
        { key: 'home_services', name: 'Home Services', description: 'Cleaning, repairs, maintenance', icon: 'Wrench' },
        { key: 'landscaping', name: 'Landscaping', description: 'Lawn care, landscaping, snow removal', icon: 'Leaf' },
        { key: 'professional', name: 'Professional Services', description: 'Consulting, coaching, other services', icon: 'Briefcase' },
      ]);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Choose Your Industry</h2>
      <p className="text-gray-600 mb-6">
        This helps us customize Attra for your business
      </p>

      <RadioGroup value={value} onValueChange={onChange}>
        <div className="space-y-3">
          {verticals.map((vertical) => {
            const Icon = iconMap[vertical.icon] || Briefcase;
            return (
              <Label
                key={vertical.key}
                htmlFor={vertical.key}
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer hover:border-primary transition-colors ${
                  value === vertical.key ? 'border-primary bg-blue-50' : 'border-gray-200'
                }`}
              >
                <RadioGroupItem
                  value={vertical.key}
                  id={vertical.key}
                  className="mt-1"
                />
                <Icon className="w-6 h-6 text-primary mx-3 flex-shrink-0" />
                <div>
                  <div className="font-semibold">{vertical.name}</div>
                  <div className="text-sm text-gray-600">{vertical.description}</div>
                </div>
              </Label>
            );
          })}
        </div>
      </RadioGroup>
    </div>
  );
};
