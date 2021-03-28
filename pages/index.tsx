import { WithMarketingLayout } from '../components';

function Index() {
  return (
    <main>
      {/* Hero section */}
      <div className="relative">
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gray-100" />
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="relative shadow-xl sm:rounded-2xl sm:overflow-hidden">
            <div className="absolute inset-0">
              <img
                className="h-full w-full object-cover"
                src="https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=2830&q=80&sat=-100"
                alt="People working on laptops"
              />
              <div
                className="absolute inset-0 bg-gradient-to-r from-purple-800 to-indigo-700"
                style={{ mixBlendMode: 'multiply' }}
              />
            </div>
            <div className="relative px-4 py-16 sm:px-6 sm:py-24 lg:py-32 lg:px-8">
              <h1 className="text-center text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                <span className="block text-white">The DeFi dashboard</span>
                <span className="block text-indigo-200">for Celo</span>
              </h1>
              <p className="mt-6 max-w-lg mx-auto text-center text-xl text-indigo-200 sm:max-w-3xl">
                Manage all your Celo assets in one place with swaps, lending
                pools, staking and more.
              </p>
              <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
                <div className="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
                  <a
                    href="/transfer"
                    className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 sm:px-8"
                  >
                    Get started
                  </a>
                  <a
                    href="/transfer"
                    className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-500 bg-opacity-60 hover:bg-opacity-70 sm:px-8"
                  >
                    Live demo
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Logo Cloud */}
      <div className="bg-gray-100">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold uppercase text-gray-500 tracking-wide">
            Trusted by over 5 very average small businesses
          </p>
          <div className="mt-6 grid grid-cols-2 gap-8 md:grid-cols-6 lg:grid-cols-5">
            <div className="col-span-1 flex justify-center md:col-span-2 lg:col-span-1">
              <img
                className="h-12"
                src="https://tailwindui.com/img/logos/tuple-logo-gray-400.svg"
                alt="Tuple"
              />
            </div>
            <div className="col-span-1 flex justify-center md:col-span-2 lg:col-span-1">
              <img
                className="h-12"
                src="https://tailwindui.com/img/logos/mirage-logo-gray-400.svg"
                alt="Mirage"
              />
            </div>
            <div className="col-span-1 flex justify-center md:col-span-2 lg:col-span-1">
              <img
                className="h-12"
                src="https://tailwindui.com/img/logos/statickit-logo-gray-400.svg"
                alt="StaticKit"
              />
            </div>
            <div className="col-span-1 flex justify-center md:col-span-2 md:col-start-2 lg:col-span-1">
              <img
                className="h-12"
                src="https://tailwindui.com/img/logos/transistor-logo-gray-400.svg"
                alt="Transistor"
              />
            </div>
            <div className="col-span-2 flex justify-center md:col-span-2 md:col-start-4 lg:col-span-1">
              <img
                className="h-12"
                src="https://tailwindui.com/img/logos/workcation-logo-gray-400.svg"
                alt="Workcation"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Gradient Feature Section */}
      <div className="bg-gradient-to-r from-purple-800 to-indigo-700">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 sm:pt-20 sm:pb-24 lg:max-w-7xl lg:pt-24 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            A dashboard built for DeFi
          </h2>
          <p className="mt-4 max-w-3xl text-lg text-purple-200">
            Everything you need to leverage DeFi bundled into one easy to use
            and accesible frontend.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-16">
            <div>
              <div>
                <span className="flex items-center justify-center h-12 w-12 rounded-md bg-white bg-opacity-10">
                  <svg
                    className="h-6 w-6 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </span>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-medium text-white">Token Swaps</h3>
                <p className="mt-2 text-base text-purple-200">
                  Leverage Ubeswap (a fork of SushiSwap on Celo) to switch
                  between your tokens with ease.
                </p>
              </div>
            </div>
            <div>
              <div>
                <span className="flex items-center justify-center h-12 w-12 rounded-md bg-white bg-opacity-10">
                  <svg
                    className="h-6 w-6 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </span>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-medium text-white">Staking</h3>
                <p className="mt-2 text-base text-purple-200">
                  Stake your CELO with validator groups to earn passive rewards.
                </p>
              </div>
            </div>
            <div>
              <div>
                <span className="flex items-center justify-center h-12 w-12 rounded-md bg-white bg-opacity-10">
                  <svg
                    className="h-6 w-6 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                </span>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-medium text-white">
                  Governance Voting
                </h3>
                <p className="mt-2 text-base text-purple-200">
                  Have your say in what happens on the network by voting on
                  proposals.
                </p>
              </div>
            </div>
            <div>
              <div>
                <span className="flex items-center justify-center h-12 w-12 rounded-md bg-white bg-opacity-10">
                  {/* Heroicon name: outline/document-report */}
                  <svg
                    className="h-6 w-6 text-white"
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
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </span>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-medium text-white">
                  Yield Farming
                </h3>
                <p className="mt-2 text-base text-purple-200">
                  Provide liquidity and farm for yield with Moola Market (a fork
                  of Aave on Celo).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Stats section */}
      <div className="relative bg-gray-900">
        <div className="h-80 absolute inset-x-0 bottom-0 xl:top-0 xl:h-full">
          <div className="h-full w-full xl:grid xl:grid-cols-2">
            <div className="h-full xl:relative xl:col-start-2">
              <img
                className="h-full w-full object-cover opacity-25 xl:absolute xl:inset-0"
                src="https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=2830&q=80&sat=-100"
                alt="People working on laptops"
              />
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-gray-900 xl:inset-y-0 xl:left-0 xl:h-full xl:w-32 xl:bg-gradient-to-r"
              />
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:max-w-7xl lg:px-8 xl:grid xl:grid-cols-2 xl:grid-flow-col-dense xl:gap-x-8">
          <div className="relative pt-12 pb-64 sm:pt-24 sm:pb-64 xl:col-start-1 xl:pb-24">
            <h2 className="text-sm font-semibold tracking-wide uppercase">
              <span className="bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
                Trusted Worldwide
              </span>
            </h2>
            <p className="mt-3 text-3xl font-extrabold text-white">
              Access financial tools for a fraction of the usual cost
            </p>
            <p className="mt-5 text-lg text-gray-100">
              Plock is a transformative DeFi dashboard in that we integrate with
              as many partners as possible in the DeFi ecosystem. By picking
              Celo as the bedrock for our platform, we're building on top of the
              mobile first ethos and enabling anyone to access financial
              primitives.
            </p>
            <div className="mt-12 grid grid-cols-1 gap-y-12 gap-x-6 sm:grid-cols-2">
              <p>
                <span className="block text-2xl font-bold text-white">10+</span>
                <span className="mt-1 block text-base text-gray-100">
                  <span className="font-medium text-white">Integrations</span>{' '}
                  are available for use via the Plock dashboard.
                </span>
              </p>
              <p>
                <span className="block text-2xl font-bold text-white">
                  $1M+
                </span>
                <span className="mt-1 block text-base text-gray-100">
                  <span className="font-medium text-white">
                    Staked and invested
                  </span>{' '}
                  through the Plock dashboard.
                </span>
              </p>
              <p>
                <span className="block text-2xl font-bold text-white">98%</span>
                <span className="mt-1 block text-base text-gray-100">
                  <span className="font-medium text-white">
                    Customer satisfaction
                  </span>{' '}
                  achieved via accessible and straightforward interfaces.
                </span>
              </p>
              <p>
                <span className="block text-2xl font-bold text-white">
                  12M+
                </span>
                <span className="mt-1 block text-base text-gray-100">
                  <span className="font-medium text-white">
                    Issues resolved
                  </span>{' '}
                  lacus nibh integer quis.
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default WithMarketingLayout(Index);
