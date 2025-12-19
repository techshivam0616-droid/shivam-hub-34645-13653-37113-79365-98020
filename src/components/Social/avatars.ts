// Avatar collections for profile pictures
export const maleAvatars = [
  {
    id: 'male_beard_1',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&accessories=prescription01&accessoriesColor=black&facialHair=beardMedium&facialHairColor=black&top=shortHairShortFlat&topColor=black&clothe=blazerAndShirt&clotheColor=blue01&skin=light',
    name: 'Cool Beard'
  },
  {
    id: 'male_beard_2',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John&facialHair=beardLight&facialHairColor=brown&top=shortHairDreads01&topColor=brown&clothe=hoodie&clotheColor=red&skin=brown',
    name: 'Stylish Look'
  },
  {
    id: 'male_beard_3',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike&facialHair=beardMajestic&facialHairColor=black&top=shortHairShortWaved&topColor=black&clothe=graphicShirt&clotheColor=heather&skin=pale',
    name: 'Majestic Beard'
  },
  {
    id: 'male_beard_4',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&facialHair=moustacheFancy&facialHairColor=auburn&top=shortHairFrizzle&topColor=auburn&clothe=collarAndSweater&clotheColor=pastelBlue&skin=light',
    name: 'Fancy Moustache'
  },
  {
    id: 'male_clean_1',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam&top=shortHairTheCaesar&topColor=black&clothe=blazerAndSweater&clotheColor=black&skin=light',
    name: 'Professional'
  }
];

export const femaleAvatars = [
  {
    id: 'female_1',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna&top=longHairStraight&topColor=brown&clothe=blazerAndShirt&clotheColor=pink&skin=light&accessories=prescription02',
    name: 'Elegant Look'
  },
  {
    id: 'female_2',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya&top=longHairCurly&topColor=black&clothe=graphicShirt&clotheColor=red&skin=brown',
    name: 'Curly Queen'
  },
  {
    id: 'female_3',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zara&top=longHairBob&topColor=auburn&clothe=hoodie&clotheColor=pastelGreen&skin=pale',
    name: 'Stylish Bob'
  }
];

export const allAvatars = [...maleAvatars, ...femaleAvatars];

export const getAvatarById = (id: string) => {
  return allAvatars.find(a => a.id === id);
};

export const getDefaultAvatar = () => maleAvatars[0];
