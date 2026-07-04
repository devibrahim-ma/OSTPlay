import { OSTLevel } from '../types/ost-level.model';

export const MOCK_OST_LEVELS: OSTLevel[] = [
  {
    levelId: 'titanic',
    title: 'Titanic',
    audioUrl: '', // Resolving dynamically via iTunes Search API
    correctAnswers: [
      'titanic',
      'el titanic'
    ],
    hints: {
      actors: 'Leonardo DiCaprio, Kate Winslet, Billy Zane, Kathy Bates',
      director: 'James Cameron',
      frameUrl: '', // Resolving dynamically via TMDb API Search
      plot: 'Un joven artista de clase baja y una aristócrata se enamoran a bordo de un colosal barco de pasajeros que choca con un iceberg en su viaje inaugural en 1912.'
    }
  },
  {
    levelId: 'gladiator',
    title: 'Gladiator',
    audioUrl: '', // Resolving dynamically via iTunes Search API
    correctAnswers: [
      'gladiator',
      'el gladiador',
      'gladiador'
    ],
    hints: {
      actors: 'Russell Crowe, Joaquin Phoenix, Connie Nielsen, Oliver Reed',
      director: 'Ridley Scott',
      frameUrl: '', // Resolving dynamically via TMDb API Search
      plot: 'Un leal general de las legiones romanas es traicionado por el codicioso hijo del emperador, convirtiéndose en esclavo y luchando en la arena de gladiadores para vengar a su familia.'
    }
  },
  {
    levelId: 'star-wars',
    title: 'Star Wars',
    audioUrl: '', // Resolving dynamically via iTunes Search API
    correctAnswers: [
      'star wars',
      'la guerra de las galaxias',
      'una nueva esperanza',
      'star wars una nueva esperanza'
    ],
    hints: {
      actors: 'Mark Hamill, Harrison Ford, Carrie Fisher, Alec Guinness',
      director: 'George Lucas',
      frameUrl: '', // Resolving dynamically via TMDb API Search
      plot: 'Un joven granjero de un planeta desértico inicia un viaje espacial para rescatar a una princesa, guiado por un viejo maestro caballero en una lucha contra un imperio opresor.'
    }
  },
  {
    levelId: 'pirates-caribbean',
    title: 'Piratas del Caribe',
    audioUrl: '', // Resolving dynamically via iTunes Search API
    correctAnswers: [
      'piratas del caribe',
      'pirates of the caribbean',
      'la maldicion de la perla negra',
      'piratas del caribe la maldicion de la perla negra'
    ],
    hints: {
      actors: 'Johnny Depp, Orlando Bloom, Keira Knightley, Geoffrey Rush',
      director: 'Gore Verbinski',
      frameUrl: '', // Resolving dynamically via TMDb API Search
      plot: 'El excéntrico capitán Jack Sparrow une fuerzas con un herrero para rescatar a la hija de un gobernador de la tripulación de marineros malditos de su antiguo navío robado.'
    }
  },
  {
    levelId: 'inception',
    title: 'Inception (Origen)',
    audioUrl: '', // Resolving dynamically via iTunes Search API
    correctAnswers: [
      'inception',
      'origen',
      'el origen'
    ],
    hints: {
      actors: 'Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page, Tom Hardy',
      director: 'Christopher Nolan',
      frameUrl: '', // Resolving dynamically via TMDb API Search
      plot: 'Un hábil espía corporativo experto en entrar a los sueños de las personas para extraer secretos recibe el encargo inverso: implantar una idea en la mente de un heredero empresarial.'
    }
  }
];
