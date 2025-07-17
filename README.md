# Virtual Try-On Web App

A modern, mobile-first virtual try-on web application that allows users to capture photos, select clothing, and see realistic virtual try-on results synced across devices.

## Features

- **Mobile-First Design**: Optimized for smartphones with responsive design
- **Camera Integration**: Native camera capture with environment-facing camera
- **Clothing Catalog**: Grid view of clothing items with upload functionality
- **Virtual Try-On**: Integration with Fashn.ai API for realistic clothing simulation
- **Real-time Sync**: Socket.IO integration for cross-device synchronization
- **Display Mode**: Large screen interface for viewing results
- **QR Code Pairing**: Easy session sharing between mobile and display devices

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS for responsive design
- **Real-time Communication**: Socket.IO client
- **State Management**: React Context API
- **Icons**: Lucide React
- **QR Codes**: React QR Code
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Socket.IO server (for real-time features)
- Fashn.ai API key (for virtual try-on)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   # .env
   VITE_SOCKET_URL=your-socket-server-url
   VITE_FASHN_API_URL=https://api.fashn.ai
   VITE_FASHN_API_KEY=your-fashn-api-key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

### Mobile Interface (`/mobile`)

1. **Camera Capture**: Tap to take a photo using the device camera
2. **Clothing Selection**: Choose from catalog or upload custom clothing
3. **Virtual Try-On**: Process the images through Fashn.ai API
4. **Result Viewing**: See the try-on result and share to display screen

### Display Mode (`/display`)

1. **Session Management**: Generate QR codes for mobile pairing
2. **Real-time Results**: Automatically receive and display try-on results
3. **Large Screen Optimization**: Designed for TV/laptop viewing

## API Integration

### Fashn.ai API

The app integrates with Fashn.ai for virtual try-on processing:

```typescript
const response = await performTryOn(userImage, clothingImage, {
  fit: 'normal',
  style: 'realistic'
});
```

### Socket.IO Events

- `join-session`: Join a specific session
- `try-on-result`: Send/receive try-on results
- `session-update`: Session status updates

## Project Structure

```
src/
├── components/
│   ├── CameraInput.tsx      # Camera capture component
│   ├── ClothSelector.tsx    # Clothing selection grid
│   ├── TryOnResult.tsx      # Result display component
│   ├── DisplayScreen.tsx    # Large screen interface
│   ├── MobileInterface.tsx  # Mobile app interface
│   ├── LoadingSpinner.tsx   # Loading component
│   └── ErrorBoundary.tsx    # Error handling
├── contexts/
│   ├── SocketContext.tsx    # Socket.IO context
│   └── SessionContext.tsx   # Session management
├── services/
│   └── fashionApi.ts        # Fashn.ai API integration
└── App.tsx                  # Main app component
```

## Features in Detail

### Camera Integration

- Uses `capture="environment"` for rear camera
- Supports both camera capture and gallery upload
- Image preview and confirmation

### Clothing Catalog

- Grid layout with hover effects
- Category-based organization
- Custom image upload with file validation

### Real-time Synchronization

- Session-based pairing with QR codes
- Cross-device result sharing
- Connection status indicators

### Error Handling

- Comprehensive error boundaries
- API failure fallbacks
- User-friendly error messages
- Retry mechanisms

## Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run lint`: Run ESLint
- `npm run preview`: Preview production build

### Best Practices

1. **File Organization**: Each component in separate files
2. **Error Handling**: Comprehensive error boundaries and fallbacks
3. **Performance**: Optimized images and lazy loading
4. **Accessibility**: ARIA labels and keyboard navigation
5. **Mobile-First**: Responsive design with touch-friendly interactions

## Deployment

The app can be deployed to any static hosting service:

1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Configure environment variables on the hosting platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.