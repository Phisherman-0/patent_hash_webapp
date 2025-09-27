export interface PatentCategory {
  id: string;
  name: string;
  description: string;
  subcategories?: PatentSubcategory[];
}

export interface PatentSubcategory {
  id: string;
  name: string;
  description: string;
}

export const PATENT_CATEGORIES: PatentCategory[] = [
  {
    id: 'biotechnology',
    name: 'Biotechnology & Life Sciences',
    description: 'Patents related to biological processes, genetic engineering, pharmaceuticals, and medical devices',
    subcategories: [
      { id: 'pharmaceuticals', name: 'Pharmaceuticals', description: 'Drug compounds, formulations, and delivery systems' },
      { id: 'medical-devices', name: 'Medical Devices', description: 'Diagnostic, therapeutic, and surgical instruments' },
      { id: 'genetic-engineering', name: 'Genetic Engineering', description: 'Gene therapy, CRISPR, and genetic modifications' },
      { id: 'bioprocessing', name: 'Bioprocessing', description: 'Fermentation, cell culture, and biotechnology manufacturing' },
      { id: 'diagnostics', name: 'Diagnostics', description: 'Medical testing, biomarkers, and diagnostic methods' }
    ]
  },
  {
    id: 'information-technology',
    name: 'Information Technology',
    description: 'Software, hardware, networking, and digital technologies',
    subcategories: [
      { id: 'software', name: 'Software & Algorithms', description: 'Computer programs, algorithms, and software architectures' },
      { id: 'artificial-intelligence', name: 'Artificial Intelligence', description: 'Machine learning, neural networks, and AI systems' },
      { id: 'cybersecurity', name: 'Cybersecurity', description: 'Encryption, security protocols, and data protection' },
      { id: 'blockchain', name: 'Blockchain & Cryptocurrency', description: 'Distributed ledgers, smart contracts, and digital currencies' },
      { id: 'cloud-computing', name: 'Cloud Computing', description: 'Distributed computing, virtualization, and cloud services' },
      { id: 'networking', name: 'Networking & Communications', description: 'Network protocols, telecommunications, and data transmission' }
    ]
  },
  {
    id: 'mechanical-engineering',
    name: 'Mechanical Engineering',
    description: 'Mechanical systems, manufacturing processes, and industrial equipment',
    subcategories: [
      { id: 'automotive', name: 'Automotive', description: 'Vehicle systems, engines, and transportation technology' },
      { id: 'aerospace', name: 'Aerospace', description: 'Aircraft, spacecraft, and aviation technology' },
      { id: 'manufacturing', name: 'Manufacturing Processes', description: 'Production methods, automation, and industrial processes' },
      { id: 'robotics', name: 'Robotics & Automation', description: 'Robotic systems, control mechanisms, and automated machinery' },
      { id: 'energy-systems', name: 'Energy Systems', description: 'Power generation, energy storage, and mechanical energy systems' }
    ]
  },
  {
    id: 'electrical-engineering',
    name: 'Electrical & Electronics',
    description: 'Electronic devices, circuits, and electrical systems',
    subcategories: [
      { id: 'semiconductors', name: 'Semiconductors', description: 'Microprocessors, memory devices, and integrated circuits' },
      { id: 'consumer-electronics', name: 'Consumer Electronics', description: 'Mobile devices, appliances, and entertainment systems' },
      { id: 'power-electronics', name: 'Power Electronics', description: 'Power conversion, motor drives, and electrical power systems' },
      { id: 'sensors', name: 'Sensors & Instrumentation', description: 'Measurement devices, sensors, and monitoring equipment' },
      { id: 'telecommunications', name: 'Telecommunications', description: 'Communication systems, wireless technology, and signal processing' }
    ]
  },
  {
    id: 'chemical-engineering',
    name: 'Chemical & Materials',
    description: 'Chemical processes, materials science, and chemical compositions',
    subcategories: [
      { id: 'polymers', name: 'Polymers & Plastics', description: 'Synthetic materials, polymer chemistry, and plastic manufacturing' },
      { id: 'nanomaterials', name: 'Nanomaterials', description: 'Nanostructures, nanocomposites, and nanotechnology applications' },
      { id: 'catalysts', name: 'Catalysts & Chemical Processes', description: 'Chemical reactions, catalytic processes, and industrial chemistry' },
      { id: 'coatings', name: 'Coatings & Surface Treatments', description: 'Protective coatings, surface modifications, and material treatments' },
      { id: 'green-chemistry', name: 'Green Chemistry', description: 'Sustainable chemistry, environmental processes, and eco-friendly materials' }
    ]
  },
  {
    id: 'renewable-energy',
    name: 'Renewable Energy',
    description: 'Clean energy technologies and sustainable power systems',
    subcategories: [
      { id: 'solar', name: 'Solar Energy', description: 'Photovoltaic systems, solar thermal, and solar technology' },
      { id: 'wind', name: 'Wind Energy', description: 'Wind turbines, wind power systems, and wind technology' },
      { id: 'energy-storage', name: 'Energy Storage', description: 'Batteries, capacitors, and energy storage systems' },
      { id: 'fuel-cells', name: 'Fuel Cells', description: 'Hydrogen fuel cells and alternative fuel technologies' },
      { id: 'smart-grid', name: 'Smart Grid', description: 'Intelligent power distribution and grid management systems' }
    ]
  },
  {
    id: 'agriculture',
    name: 'Agriculture & Food Technology',
    description: 'Agricultural innovations, food processing, and farming technology',
    subcategories: [
      { id: 'precision-agriculture', name: 'Precision Agriculture', description: 'GPS farming, drone technology, and precision farming tools' },
      { id: 'food-processing', name: 'Food Processing', description: 'Food preservation, packaging, and processing technologies' },
      { id: 'agricultural-biotechnology', name: 'Agricultural Biotechnology', description: 'Crop genetics, plant breeding, and agricultural biotech' },
      { id: 'sustainable-farming', name: 'Sustainable Farming', description: 'Organic farming, sustainable agriculture, and eco-friendly practices' }
    ]
  },
  {
    id: 'environmental',
    name: 'Environmental Technology',
    description: 'Environmental protection, pollution control, and sustainability technologies',
    subcategories: [
      { id: 'water-treatment', name: 'Water Treatment', description: 'Water purification, wastewater treatment, and water management' },
      { id: 'air-pollution', name: 'Air Pollution Control', description: 'Emission control, air filtration, and atmospheric protection' },
      { id: 'waste-management', name: 'Waste Management', description: 'Recycling, waste processing, and waste reduction technologies' },
      { id: 'carbon-capture', name: 'Carbon Capture', description: 'CO2 capture, storage, and carbon reduction technologies' }
    ]
  },
  {
    id: 'transportation',
    name: 'Transportation',
    description: 'Transportation systems, logistics, and mobility solutions',
    subcategories: [
      { id: 'electric-vehicles', name: 'Electric Vehicles', description: 'EV technology, charging systems, and electric mobility' },
      { id: 'autonomous-vehicles', name: 'Autonomous Vehicles', description: 'Self-driving cars, navigation systems, and vehicle automation' },
      { id: 'logistics', name: 'Logistics & Supply Chain', description: 'Transportation optimization, delivery systems, and logistics technology' },
      { id: 'public-transport', name: 'Public Transportation', description: 'Mass transit systems, railway technology, and public mobility' }
    ]
  },
  {
    id: 'construction',
    name: 'Construction & Architecture',
    description: 'Building technologies, construction methods, and architectural innovations',
    subcategories: [
      { id: 'smart-buildings', name: 'Smart Buildings', description: 'Building automation, IoT integration, and intelligent structures' },
      { id: 'sustainable-construction', name: 'Sustainable Construction', description: 'Green building materials, energy-efficient construction' },
      { id: 'construction-equipment', name: 'Construction Equipment', description: 'Heavy machinery, construction tools, and building equipment' },
      { id: 'building-materials', name: 'Building Materials', description: 'Advanced materials, composites, and construction materials' }
    ]
  },
  {
    id: 'other',
    name: 'Other',
    description: 'Patents that do not fit into the above categories',
    subcategories: [
      { id: 'business-methods', name: 'Business Methods', description: 'Business processes, financial systems, and commercial methods' },
      { id: 'gaming', name: 'Gaming & Entertainment', description: 'Video games, entertainment technology, and gaming systems' },
      { id: 'sports', name: 'Sports & Recreation', description: 'Sports equipment, recreational devices, and fitness technology' },
      { id: 'household', name: 'Household & Consumer Goods', description: 'Home appliances, consumer products, and household items' }
    ]
  }
];

export const getCategoryById = (id: string): PatentCategory | undefined => {
  return PATENT_CATEGORIES.find(category => category.id === id);
};

export const getSubcategoryById = (categoryId: string, subcategoryId: string): PatentSubcategory | undefined => {
  const category = getCategoryById(categoryId);
  return category?.subcategories?.find(sub => sub.id === subcategoryId);
};

export const getAllSubcategories = (): PatentSubcategory[] => {
  return PATENT_CATEGORIES.flatMap(category => category.subcategories || []);
};
