import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { appUrl } from '../constants';

export const WithMarketingLayout = (Component: any) => () => {
  const [menu, setMenu] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (!menu) {
        return false;
      }

      // @ts-ignore
      if (ref.current && !ref.current.contains(event.target)) {
        setMenu(false);
      }
    }

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [ref.current, menu]);

  return (
    <>
      <div className="bg-white">
        <header>
          <div className="relative bg-white">
            <div className="flex justify-between items-center max-w-7xl mx-auto px-4 py-6 sm:px-6 md:justify-start md:space-x-10 lg:px-8">
              <div className="flex justify-start lg:w-0 lg:flex-1">
                <a href="/">
                  <span className="sr-only">Plock</span>
                  <Image src="/logo.png" height={'24px'} width={'24px'} />
                </a>
              </div>
              <div className="-mr-2 -my-2 md:hidden">
                <button
                  type="button"
                  onClick={() => setMenu(true)}
                  className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                  aria-expanded="false"
                >
                  <span className="sr-only">Open menu</span>
                  {/* Heroicon name: outline/menu */}
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
              <nav className="hidden md:flex space-x-10">
                <Link href="/#features">
                  <a className="text-base font-medium text-gray-500 hover:text-gray-900">
                    Features
                  </a>
                </Link>
                <Link href="/about">
                  <a className="text-base font-medium text-gray-500 hover:text-gray-900">
                    About
                  </a>
                </Link>
              </nav>
              <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
                <a
                  href={appUrl}
                  className="ml-8 whitespace-nowrap inline-flex items-center justify-center primary-button"
                >
                  To app
                </a>
              </div>
            </div>
            {/*
  Mobile menu, show/hide based on mobile menu state.

  Entering: "duration-200 ease-out"
    From: "opacity-0 scale-95"
    To: "opacity-100 scale-100"
  Leaving: "duration-100 ease-in"
    From: "opacity-100 scale-100"
    To: "opacity-0 scale-95"
*/}
            {menu && (
              <div
                ref={ref}
                className="absolute z-30 top-0 inset-x-0 p-2 transition transform origin-top-right md:hidden"
              >
                <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white divide-y-2 divide-gray-50">
                  <div className="pt-5 pb-6 px-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <Image src="/logo.png" height={'24px'} width={'24px'} />
                      </div>
                      <div className="-mr-2">
                        <button
                          type="button"
                          onClick={() => setMenu(false)}
                          className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                        >
                          <span className="sr-only">Close menu</span>
                          {/* Heroicon name: outline/x */}
                          <svg
                            className="h-6 w-6"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="mt-6">
                      <nav className="grid grid-cols-1 gap-7">
                        <Link href="/about">
                          <a className="-m-3 p-3 flex items-center rounded-lg hover:bg-gray-50">
                            <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                              <svg
                                className="h-6 w-6"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <div className="ml-4 text-base font-medium text-gray-900">
                              About
                            </div>
                          </a>
                        </Link>
                        <Link href="/team">
                          <a className="-m-3 p-3 flex items-center rounded-lg hover:bg-gray-50">
                            <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                              <svg
                                className="h-6 w-6"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                              </svg>
                            </div>
                            <div className="ml-4 text-base font-medium text-gray-900">
                              Team
                            </div>
                          </a>
                        </Link>
                        <a
                          target="_blank"
                          href="https://chat.celo.org"
                          className="-m-3 p-3 flex items-center rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                            <svg
                              className="h-6 w-6"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                              />
                            </svg>
                          </div>
                          <div className="ml-4 text-base font-medium text-gray-900">
                            Live Chat
                          </div>
                        </a>
                      </nav>
                    </div>
                  </div>
                  <div className="py-6 px-5">
                    <div className="mt-6">
                      <a
                        href={appUrl}
                        className="w-full flex items-center justify-center primary-button"
                      >
                        To app
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        <Component />

        <footer className="bg-gray-50" aria-labelledby="footerHeading">
          <h2 id="footerHeading" className="sr-only">
            Footer
          </h2>
          <div className="max-w-7xl mx-auto pb-8 px-4 sm:px-6 lg:px-8">
            {/* <div className="xl:grid xl:grid-cols-3 xl:gap-8">
              <div className="grid grid-cols-2 gap-8 xl:col-span-2">
                <div className="md:grid md:grid-cols-2 md:gap-8">
                  <div className="mt-12 md:mt-0">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 tracking-wider uppercase">
                      Support
                    </h3>
                    <ul className="mt-4 space-y-4">
                      <li>
                        <a
                          href="#"
                          className="text-base text-gray-500 hover:text-gray-900"
                        >
                          Pricing
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="text-base text-gray-500 hover:text-gray-900"
                        >
                          Documentation
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="text-base text-gray-500 hover:text-gray-900"
                        >
                          Guides
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="text-base text-gray-500 hover:text-gray-900"
                        >
                          API Status
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="md:grid md:grid-cols-2 md:gap-8">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 tracking-wider uppercase">
                      Company
                    </h3>
                    <ul className="mt-4 space-y-4">
                      <li>
                        <a
                          href="#"
                          className="text-base text-gray-500 hover:text-gray-900"
                        >
                          About
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="text-base text-gray-500 hover:text-gray-900"
                        >
                          Blog
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="text-base text-gray-500 hover:text-gray-900"
                        >
                          Jobs
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="text-base text-gray-500 hover:text-gray-900"
                        >
                          Press
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="text-base text-gray-500 hover:text-gray-900"
                        >
                          Partners
                        </a>
                      </li>
                    </ul>
                  </div>
                  {/* <div className="mt-12 md:mt-0">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 tracking-wider uppercase">
                      Legal
                    </h3>
                    <ul className="mt-4 space-y-4">
                      <li>
                        <a
                          href="#"
                          className="text-base text-gray-500 hover:text-gray-900"
                        >
                          Claim
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="text-base text-gray-500 hover:text-gray-900"
                        >
                          Privacy
                        </a>
                      </li>
                      <li>
                        <a
                          href="#"
                          className="text-base text-gray-500 hover:text-gray-900"
                        >
                          Terms
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div> */}
            <div className="pt-8 md:flex md:items-center md:justify-between">
              <div className="flex space-x-6 md:order-2">
                {/* <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-500">
                  <span className="sr-only">Twitter</span>
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a> */}
                <a
                  href="https://github.com/alexbharley"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-500"
                  target="_blank"
                >
                  <span className="sr-only">GitHub</span>
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a
                  href="https://chat.celo.org"
                  target="_blank"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Discord</span>
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </a>
              </div>
              <p className="mt-8 text-base text-gray-600 dark:text-gray-400 md:mt-0 md:order-1">
                © 2021 Plock. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};
