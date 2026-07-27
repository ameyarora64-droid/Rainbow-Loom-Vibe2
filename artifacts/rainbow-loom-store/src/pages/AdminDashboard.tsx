import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

import {
  useGetOrders,
  useGetProducts,
  useUpdateProductColors,
  useHoldOrder,
  useUnholdOrder,
  useStartOrder,
  useCompleteOrder,
  useUpdateGlobalColor,
  useUpdateProductAvailable,
  useGetStoreStatus,
  useUpdateStoreStatus,
  getGetOrdersQueryKey,
  getGetProductsQueryKey,
  getGetStoreStatusQueryKey,
} from '@workspace/api-client-react';

import { useQueryClient } from '@tanstack/react-query';

import {
  LogOut,
  ShoppingBag,
  Palette,
  Package,
  Clock,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Store,
  Lock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

import { Input } from '@/components/ui/input';


const COLOR_MAP: Record<string, string> = {
  red: '#ef4444',
  orange: '#f97316',
  green: '#22c55e',
  blue: '#3b82f6',
  purple: '#a855f7',
  pink: '#ec4899',
  black: '#1f2937',
};


const ALL_COLORS = [
  'red',
  'orange',
  'green',
  'blue',
  'purple',
  'pink',
  'black',
];


const PATTERN_LABELS: Record<string, string> = {
  regular: 'Regular',
  dragon_scale: 'Dragon Scale',
  fish_scale: 'Fish Scale',
  double_fish_scale: 'Double Fish Scale',
};


const STATUS_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-700',
  },

  on_hold: {
    label: 'On Hold',
    className: 'bg-orange-100 text-orange-700',
  },

  in_progress: {
    label: 'In Progress',
    className: 'bg-teal-100 text-teal-700',
  },

  completed: {
    label: 'Completed',
    className: 'bg-green-100 text-green-700',
  },
};


type TabId = 'orders' | 'colors' | 'products';


export default function AdminDashboard() {

  const [, setLocation] = useLocation();

  const queryClient = useQueryClient();


  useEffect(() => {
    const token = localStorage.getItem('admin_token');

    if (!token) {
      setLocation('/admin');
    }

  }, [setLocation]);



  const {
    data: orders,
    isLoading: ordersLoading,
  } = useGetOrders();


  const {
    data: products,
    isLoading: productsLoading,
  } = useGetProducts();



  const updateColors = useUpdateProductColors();
  const holdOrder = useHoldOrder();
  const unholdOrder = useUnholdOrder();
  const startOrder = useStartOrder();
  const completeOrder = useCompleteOrder();
  const updateGlobalColor = useUpdateGlobalColor();
  const updateProductAvailable = useUpdateProductAvailable();
  const updateStoreStatus = useUpdateStoreStatus();

  const { data: storeStatus } = useGetStoreStatus();
  const storeOpen = storeStatus?.open !== false;

  const toggleStore = () => {
    updateStoreStatus.mutate(
      { data: { open: !storeOpen } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetStoreStatusQueryKey() });
        },
      }
    );
  };



  const [activeTab, setActiveTab] =
    useState<TabId>('orders');



  const [startModalOrderId, setStartModalOrderId] =
    useState<string | null>(null);


  const [timeDays, setTimeDays] =
    useState(0);

  const [timeHours, setTimeHours] =
    useState(0);

  const [timeMinutes, setTimeMinutes] =
    useState(30);



  const handleLogout = () => {

    localStorage.removeItem('admin_token');

    setLocation('/admin');

  };



  const invalidateOrders = () => {

    queryClient.invalidateQueries({
      queryKey: getGetOrdersQueryKey(),
    });

  };



  const invalidateProducts = () => {

    queryClient.invalidateQueries({
      queryKey: getGetProductsQueryKey(),
    });

  };



  const handleHold = (orderId: string) => {

    holdOrder.mutate(
      { orderId },
      {
        onSuccess: invalidateOrders,
      }
    );

  };



  const handleUnhold = (orderId: string) => {

    unholdOrder.mutate(
      { orderId },
      {
        onSuccess: invalidateOrders,
      }
    );

  };



  const handleComplete = (orderId: string) => {

    completeOrder.mutate(
      { orderId },
      {
        onSuccess: invalidateOrders,
      }
    );

  };



  const handleStartOpen = (orderId: string) => {

    setTimeDays(0);

    setTimeHours(0);

    setTimeMinutes(30);

    setStartModalOrderId(orderId);

  };



  const handleStartConfirm = () => {

    if (!startModalOrderId) return;


    startOrder.mutate(
      {
        orderId: startModalOrderId,

        data: {
          days: timeDays,
          hours: timeHours,
          minutes: timeMinutes,
        },
      },

      {
        onSuccess: () => {

          invalidateOrders();

          setStartModalOrderId(null);

        },
      }
    );

  };
  const toggleGlobalColor = (
    color: string,
    currentAvailable: boolean
  ) => {

    updateGlobalColor.mutate(
      {
        data: {
          color: color as any,
          available: !currentAvailable,
        },
      },
      {
        onSuccess: invalidateProducts,
      }
    );

  };



  const toggleProductAvailable = (
    productId: string,
    currentAvailable: boolean
  ) => {

    updateProductAvailable.mutate(
      {
        productId,

        data: {
          available: !currentAvailable,
        },
      },
      {
        onSuccess: invalidateProducts,
      }
    );

  };



  const toggleProductColor = (
    productId: string,
    color: string,
    currentAvailable: boolean
  ) => {

    const product = products?.find(
      (p) => p.id === productId
    );


    if (!product) return;


    const updatedColors = product.colors.map((c) =>
      c.color === color
        ? {
            ...c,
            available: !currentAvailable,
          }
        : c
    );


    updateColors.mutate(
      {
        productId,

        data: {
          colors: updatedColors,
        },
      },
      {
        onSuccess: invalidateProducts,
      }
    );

  };



  const globalColorAvailability: Record<string, boolean> =
    {};


  ALL_COLORS.forEach((color) => {

    if (!products || products.length === 0) {

      globalColorAvailability[color] = true;

    } else {

      globalColorAvailability[color] =
        products.some((product) =>
          product.colors.some(
            (c) =>
              c.color === color &&
              c.available
          )
        );

    }

  });



  return (

    <div className="max-w-6xl mx-auto px-4 py-10">


      {/* HEADER */}

      <div className="flex items-center justify-between mb-10">

        <div>

          <h1 className="font-display text-4xl sm:text-5xl text-gray-800">

            Admin Dashboard

          </h1>


          <p className="text-gray-400 font-bold">

            Manage orders, colors, and products

          </p>

        </div>



        <div className="flex items-center gap-3">

          <button
            onClick={toggleStore}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-bold transition-all ${
              storeOpen
                ? 'bg-teal-50 border-teal-300 text-teal-700 hover:bg-teal-100'
                : 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'
            }`}
          >
            {storeOpen ? (
              <>
                <Store className="w-5 h-5" />
                Store Open
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Store Closed
              </>
            )}
          </button>

          <Button

            onClick={handleLogout}

            variant="outline"

            className="flex items-center gap-2 rounded-xl border-2 font-bold"

          >

            <LogOut className="w-5 h-5" />

            Logout

          </Button>

        </div>


      </div>





      {/* TABS */}

      <div className="flex gap-3 mb-8 flex-wrap">


        {([

          {
            id: 'orders',
            icon: ShoppingBag,
            label: 'Orders',
          },

          {
            id: 'colors',
            icon: Palette,
            label: 'Color Stock',
          },

          {
            id: 'products',
            icon: Package,
            label: 'Products',
          },


        ] as const).map((tab) => {


          const Icon = tab.icon;


          return (

            <button

              key={tab.id}

              onClick={() =>
                setActiveTab(tab.id)
              }


              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-lg ${
                activeTab === tab.id

                  ? 'bg-pink-500 text-white'

                  : 'bg-white border-2 text-gray-600'

              }`}

            >

              <Icon className="w-5 h-5" />

              {tab.label}


            </button>

          );


        })}


      </div>





      {/* ORDERS TAB */}

      {activeTab === 'orders' && (

        <div className="bg-white rounded-3xl shadow-sm border-2 overflow-hidden">


          <div className="p-6 border-b">

            <h2 className="font-display text-2xl">

              All Orders {orders &&
                `(${orders.length})`}

            </h2>

          </div>




          {ordersLoading ? (

            <div className="py-16 text-center">

              Loading...

            </div>


          ) : !orders || orders.length === 0 ? (


            <div className="py-20 text-center text-gray-400">

              <ShoppingBag className="mx-auto w-16 h-16 mb-4" />

              <p className="font-display text-2xl">

                No orders yet!

              </p>


            </div>


          ) : (


            <div className="divide-y">


              {[...orders].reverse().map((order) => {


                const badge =
                  STATUS_BADGE[order.status] ??
                  STATUS_BADGE.pending;



                return (

                  <div
                    key={order.id}
                    className="p-6"
                  >


                    <div className="flex justify-between gap-5 flex-wrap">


                      <div>


                        <div className="flex gap-3 items-center mb-2">

                          <span className="font-display text-2xl text-pink-500">

                            {order.orderNumber}

                          </span>


                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.className}`}>

                            {badge.label}

                          </span>


                        </div>



                        <p className="font-bold">

                          {order.customerName}

                        </p>



                        <p className="text-gray-400 text-sm">

                          {order.customerEmail}

                        </p>




                        {order.items.map((item, i) => (

                          <div
                            key={i}
                            className="flex gap-2 items-center text-sm mt-2"
                          >

                            <span className="font-semibold">

                              {item.productName}

                            </span>


                            <span className="text-gray-400">

                              {PATTERN_LABELS[item.pattern]}

                            </span>


                          </div>

                        ))}


                        <p className="text-teal-600 font-bold mt-3">

                          ${order.total}

                        </p>


                      </div>





                      <div className="flex flex-col gap-2">


                        {order.status === 'pending' && (

                          <>

                            <Button

                              onClick={() =>
                                handleHold(order.id)
                              }

                              className="bg-orange-400 text-white"

                            >

                              <PauseCircle className="w-4 h-4 mr-2" />

                              Hold

                            </Button>



                            <Button

                              onClick={() =>
                                handleStartOpen(order.id)
                              }

                              className="bg-teal-500 text-white"

                            >

                              <CheckCircle2 className="w-4 h-4 mr-2" />

                              Start Making

                            </Button>


                          </>


                        )}



                        {order.status === 'on_hold' && (

                          <>

                            <Button

                              onClick={() =>
                                handleUnhold(order.id)
                              }

                              className="bg-teal-500 text-white"

                            >

                              <PlayCircle className="w-4 h-4 mr-2" />

                              Unhold

                            </Button>


                            <Button

                              onClick={() =>
                                handleStartOpen(order.id)
                              }

                              className="bg-pink-500 text-white"

                            >

                              Start Making

                            </Button>


                          </>

                        )}




                        {order.status === 'in_progress' && (

                          <Button

                            onClick={() =>
                              handleComplete(order.id)
                            }

                            className="bg-green-500 text-white"

                          >

                            <CheckCircle2 className="w-4 h-4 mr-2" />

                            Complete

                          </Button>


                        )}


                      </div>


                    </div>


                  </div>


                );


              })}


            </div>


          )}


        </div>


      )}
            {/* COLOR STOCK TAB */}

            {activeTab === 'colors' && (

              <div>


                <div className="bg-white rounded-3xl shadow-sm border-2 overflow-hidden mb-6">


                  <div className="bg-teal-50 p-6">

                    <h2 className="font-display text-2xl text-teal-700">

                      Global Color Inventory

                    </h2>


                    <p className="text-teal-500 font-semibold text-sm">

                      Turn colors on/off for products

                    </p>


                  </div>




                  <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">


                    {ALL_COLORS.map((color) => {


                      const available =
                        globalColorAvailability[color];



                      return (

                        <div
                          key={color}
                          className="flex flex-col items-center gap-3 p-4 rounded-2xl border-2"
                        >


                          <div

                            className="w-14 h-14 rounded-full border-4 border-white shadow"

                            style={{
                              backgroundColor:
                                COLOR_MAP[color]
                            }}

                          />



                          <span className="capitalize font-bold">

                            {color}

                          </span>



                          <button

                            onClick={() =>
                              toggleGlobalColor(
                                color,
                                available
                              )
                            }

                            className={`w-14 h-7 rounded-full ${
                              available
                                ? 'bg-teal-400'
                                : 'bg-gray-300'
                            }`}

                          >

                            <span
                              className={`block w-6 h-6 bg-white rounded-full transition ${
                                available
                                  ? 'translate-x-7'
                                  : ''
                              }`}
                            />

                          </button>


                        </div>

                      );


                    })}


                  </div>


                </div>




                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">


                  {products?.map((product) => (

                    <div

                      key={product.id}

                      className="bg-white rounded-3xl border-2 p-5"

                    >


                      <h3 className="font-display text-xl">

                        {product.name}

                      </h3>



                      <p className="text-teal-500 font-bold mb-4">

                        ${product.price}

                      </p>




                      {product.colors.map((color) => (

                        <div

                          key={color.color}

                          className="flex justify-between items-center mb-3"

                        >


                          <div className="flex items-center gap-2">


                            <div

                              className="w-7 h-7 rounded-full border"

                              style={{
                                backgroundColor:
                                  COLOR_MAP[color.color!]
                              }}

                            />


                            <span className="capitalize">

                              {color.color}

                            </span>


                          </div>




                          <button

                            onClick={() =>
                              toggleProductColor(
                                product.id,
                                color.color!,
                                color.available!
                              )
                            }

                            className={`w-12 h-6 rounded-full ${
                              color.available
                                ? 'bg-teal-400'
                                : 'bg-gray-300'
                            }`}

                          >

                            <span

                              className={`block w-5 h-5 bg-white rounded-full transition ${
                                color.available
                                  ? 'translate-x-6'
                                  : ''
                              }`}

                            />


                          </button>


                        </div>


                      ))}



                    </div>


                  ))}


                </div>


              </div>


            )}






            {/* PRODUCTS TAB */}

            {activeTab === 'products' && (

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">


                {products?.map((product) => (

                  <div

                    key={product.id}

                    className="bg-white rounded-3xl border-2 p-6"

                  >


                    <div className="flex justify-between items-center mb-5">


                      <div>

                        <h3 className="font-display text-2xl">

                          {product.name}

                        </h3>


                        <p className="text-teal-500 font-bold">

                          ${product.price}

                        </p>


                      </div>



                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold ${
                          product.available
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >

                        {product.available
                          ? 'Available'
                          : 'Hidden'}

                      </span>


                    </div>





                    <Button

                      onClick={() =>
                        toggleProductAvailable(
                          product.id,
                          product.available
                        )
                      }

                      disabled={
                        updateProductAvailable.isPending
                      }

                      className="w-full"

                    >

                      {product.available
                        ? 'Mark Unavailable'
                        : 'Mark Available'}

                    </Button>



                  </div>


                ))}



              </div>


            )}






            {/* START MAKING MODAL */}


            <Dialog

              open={!!startModalOrderId}

              onOpenChange={(open) =>
                !open &&
                setStartModalOrderId(null)
              }

            >


              <DialogContent className="rounded-3xl">


                <DialogHeader>

                  <DialogTitle className="text-center text-2xl">

                    How long will it take?

                  </DialogTitle>


                  <DialogDescription className="text-center">

                    Set an estimate for the customer

                  </DialogDescription>


                </DialogHeader>





                <div className="grid grid-cols-3 gap-3">


                  <Input

                    type="number"

                    value={timeDays}

                    onChange={(e) =>
                      setTimeDays(
                        Number(e.target.value)
                      )
                    }

                    placeholder="Days"

                  />


                  <Input

                    type="number"

                    value={timeHours}

                    onChange={(e) =>
                      setTimeHours(
                        Number(e.target.value)
                      )
                    }

                    placeholder="Hours"

                  />


                  <Input

                    type="number"

                    value={timeMinutes}

                    onChange={(e) =>
                      setTimeMinutes(
                        Number(e.target.value)
                      )
                    }

                    placeholder="Minutes"

                  />


                </div>





                <Button

                  onClick={handleStartConfirm}

                  disabled={startOrder.isPending}

                  className="w-full bg-teal-500 text-white"

                >

                  {startOrder.isPending
                    ? 'Saving...'
                    : '🎨 Start Making'}

                </Button>



              </DialogContent>


            </Dialog>




          </div>

        );

      }