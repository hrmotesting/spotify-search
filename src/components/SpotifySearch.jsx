import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

import PlayButton from '../assets/play-button.png';

function SpotifySearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState('');
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showEmailError, setShowEmailError] = useState(false);

  useEffect(() => {
    const getToken = async () => {
      const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
      
      try {
        console.log('Attempting to get token...');
        
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');

        const response = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
          },
          body: params
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Token response not ok:', response.status, errorText);
          return;
        }

        const data = await response.json();
        console.log('Got token successfully');
        setToken(data.access_token);
      } catch (error) {
        console.error('Error getting token:', error);
      }
    };

    getToken();
  }, []);

  const validateEmail = (email) => {
    const regex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    const isValid = regex.test(email);
    if (!isValid) {
      setEmailError('Please enter a valid email (example@domain.com)');
      return false;
    }
    return true;
  };

  const searchSpotify = async (searchQuery) => {
    if (!searchQuery.trim() || !token) {
      console.log('Search cancelled:', { hasQuery: !!searchQuery.trim(), hasToken: !!token });
      return;
    }

    try {
      setIsLoading(true);
      console.log('Starting search...');

      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=5`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Search response not ok:', response.status, errorText);
        return;
      }

      const data = await response.json();
      console.log('Search completed successfully');
      setResults(data.tracks?.items || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (value) {
      searchSpotify(value);
    } else {
      setResults([]);
    }
  };

  const handleTrackSelect = (track) => {
    setSelectedTrack(track);
    setResults([]);
    setQuery('');
  };

  const handleSubmitCampaign = async () => {
    if (!selectedTrack || !email) {
      setShowEmailError(true);
      setEmailError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setShowEmailError(true);
      return;
    }

    try {
      setIsSubmitting(true);
      const webhookUrl = import.meta.env.VITE_GHL_WEBHOOK_URL;

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          songName: selectedTrack.name,
          artistName: selectedTrack.artists.map(a => a.name).join(', '),
          albumName: selectedTrack.album.name,
          spotifyUrl: selectedTrack.external_urls.spotify,
          albumArtwork: selectedTrack.album.images[0]?.url,
          previewUrl: selectedTrack.preview_url,
          submittedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        window.location.href = import.meta.env.VITE_REDIRECT_URL || 'https://apolone.com/boost-checkout-7235';
      } else {
        throw new Error('Failed to submit campaign');
      }
    } catch (error) {
      console.error('Failed to submit to webhook:', error);
      alert('Failed to submit campaign. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {!selectedTrack ? (
        <div className="w-full max-w-[520px]">
          {/* Search Bar with fixed width */}
          <div className="relative bg-white rounded-2xl shadow-sm w-full mb-3">
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="Search track title or Spotify link"
              className="w-full p-4 pl-12 rounded-2xl outline-none"
            />
            <Search 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" 
              size={20} 
            />
          </div>

          {/* Results with white background */}
          {results.length > 0 && (
            <div className="w-full bg-white rounded-[20px] overflow-hidden py-2 shadow-search">
              {results.map((track) => (
                <div
                  key={track.id}
                  onClick={() => handleTrackSelect(track)}
                  className="flex items-centercursor-pointer px-5 mt-0 cursor-pointer hover:bg-gray-250 transition-all duration-500"
                >
                  <div className="flex items-center gap-4 w-full border-b-[1px] result-item-border py-4">
                    <img 
                      src={track.album.images[0]?.url} 
                      alt={track.album.name}
                      className="w-12 h-12 rounded-[4px] object-cover"
                    />
                    <div className="w-full flex justify-center items-center gap-4">
                      <div className='w-full'>
                        <div className="font-medium text-left text-sm leading-[18px] text-gray-850 font-familjenGrotesk truncate-2">{track.name}</div>
                        <div className="text-gray-750 text-left text-xs leading-[18px] font-familjenGrotesk truncate-2">
                          {track.artists.map(a => a.name).join(', ')}
                        </div>
                      </div>
                      <div className='1/5 min-w-9'>
                        <img src={PlayButton} alt="Play" className='w-8 h-8' />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Selected Track View
        <div className="w-full max-w-[520px]">
          <div className="bg-white rounded-xl p-6">
            <div className="flex flex-col items-center">
              <img 
                src={selectedTrack.album.images[0]?.url} 
                alt={selectedTrack.album.name}
                className="w-40 h-40 rounded-lg shadow-lg mb-4 object-cover"
              />
              <h2 className="text-xl font-bold text-center mb-2">{selectedTrack.name}</h2>
              <p className="text-gray-600 text-center mb-4">
                {selectedTrack.artists.map(a => a.name).join(', ')}
              </p>
              <p className="text-gray-500 text-sm mb-6 text-center">{selectedTrack.album.name}</p>
              
              <div className="w-full mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="example@domain.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (showEmailError) {
                      validateEmail(e.target.value);
                    }
                  }}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    showEmailError && emailError ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                {showEmailError && emailError && (
                  <p className="text-red-500 text-sm mt-1 text-left">{emailError}</p>
                )}
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={handleSubmitCampaign}
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-[#FF4D4D] text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-center"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Campaign'}
                </button>
                <button
                  onClick={() => {
                    setSelectedTrack(null);
                    setEmail('');
                    setEmailError('');
                    setShowEmailError(false);
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center"
                >
                  Choose Different Song
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpotifySearch;