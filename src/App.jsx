import { createSignal, onMount, Show, For } from 'solid-js';
import { supabase } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-solid';
import { ThemeSupa } from '@supabase/auth-ui-shared';

function App() {
  const [user, setUser] = createSignal(null);
  const [currentPage, setCurrentPage] = createSignal('login');
  const [shows, setShows] = createSignal([]);
  const [loading, setLoading] = createSignal(false);

  const checkUserSignedIn = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      setCurrentPage('homePage');
      fetchShows();
    }
  };

  const fetchShows = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.tvmaze.com/shows');
      if (response.ok) {
        const data = await response.json();
        const arabicShows = data.filter(show => show.language === 'Arabic');
        setShows(arabicShows);
      } else {
        console.error('Error fetching shows:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching shows:', error);
    } finally {
      setLoading(false);
    }
  };

  onMount(() => {
    checkUserSignedIn();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setUser(session.user);
        setCurrentPage('homePage');
        fetchShows();
      } else {
        setUser(null);
        setCurrentPage('login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentPage('login');
  };

  return (
    <div class="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 p-4 text-gray-800">
      <Show
        when={currentPage() === 'homePage'}
        fallback={
          <div class="flex items-center justify-center min-h-screen">
            <div class="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
              <h2 class="text-3xl font-bold mb-6 text-center text-purple-600">تسجيل الدخول مع ZAPT</h2>
              <a
                href="https://www.zapt.ai"
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-500 hover:underline mb-6 block text-center"
              >
                تعرف على المزيد حول ZAPT
              </a>
              <Auth
                supabaseClient={supabase}
                appearance={{ theme: ThemeSupa }}
                providers={['google', 'facebook', 'apple']}
                magicLink={true}
                view="magic_link"
                showLinks={false}
                authView="magic_link"
              />
            </div>
          </div>
        }
      >
        <div class="max-w-6xl mx-auto">
          <div class="flex justify-between items-center mb-8">
            <h1 class="text-4xl font-bold text-purple-600">التلفاز العربي الاحترافي</h1>
            <button
              class="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer"
              onClick={handleSignOut}
            >
              تسجيل الخروج
            </button>
          </div>

          <Show when={loading()}>
            <div class="flex justify-center">
              <div class="loader"></div>
            </div>
          </Show>

          <Show when={!loading()}>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <For each={shows()}>
                {(show) => (
                  <div class="bg-white p-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105">
                    <img
                      src={show.image ? show.image.medium : 'https://via.placeholder.com/210x295'}
                      alt={show.name}
                      class="w-full h-64 object-cover rounded-md mb-4"
                    />
                    <h2 class="text-2xl font-bold mb-2 text-purple-600">{show.name}</h2>
                    <p class="text-gray-700 line-clamp-3">
                      {show.summary && show.summary.replace(/<[^>]+>/g, '')}
                    </p>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}

export default App;