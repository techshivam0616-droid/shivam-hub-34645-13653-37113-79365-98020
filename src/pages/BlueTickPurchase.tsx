import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, addDoc, collection, query, where, getDocs, updateDoc, increment, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, CreditCard, Clock, Ticket, X, Sparkles, Crown } from 'lucide-react';

interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  active: boolean;
}

const BlueTickPurchase = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [plan, setPlan] = useState('monthly');
  const [transactionId, setTransactionId] = useState('');
  const [step, setStep] = useState<'plan' | 'coupon' | 'payment' | 'confirm'>('plan');
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percentOff: number } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchSettings();
    checkPendingRequest();
    fetchSpecialOffers();
  }, [user]);

  const fetchSpecialOffers = async () => {
    try {
      const q = query(collection(db, 'special_offers'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const offers = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as SpecialOffer))
        .filter(offer => offer.active);
      setSpecialOffers(offers);
    } catch (error) {
      console.error('Error fetching special offers:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'bluetick');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      } else {
        toast.error('Blue tick purchase is not available');
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setFetching(false);
    }
  };

  const checkPendingRequest = async () => {
    if (!user?.email) return;
    
    try {
      const q = query(
        collection(db, 'bluetick_requests'),
        where('userEmail', '==', user.email),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      setHasPendingRequest(!snapshot.empty);
    } catch (error) {
      console.error('Error checking pending request:', error);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setApplyingCoupon(true);
    try {
      const q = query(
        collection(db, 'coupons'),
        where('code', '==', couponCode.toUpperCase())
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        toast.error('Invalid coupon code');
        return;
      }

      const couponDoc = snapshot.docs[0];
      const coupon = couponDoc.data();

      if (coupon.usedCount >= coupon.maxUsers) {
        toast.error('This coupon has expired');
        return;
      }

      setAppliedCoupon({
        code: coupon.code,
        percentOff: coupon.percentOff
      });
      toast.success(`Coupon applied! ${coupon.percentOff}% off`);
    } catch (error) {
      toast.error('Failed to apply coupon');
      console.error(error);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const getPrice = (planType: string) => {
    let price = 0;
    if (planType === 'weekly') price = parseFloat(settings?.weeklyPrice || '29');
    else if (planType === 'monthly') price = parseFloat(settings?.monthlyPrice || '99');
    else price = parseFloat(settings?.yearlyPrice || '999');

    if (appliedCoupon) {
      price = price - (price * appliedCoupon.percentOff / 100);
    }
    return Math.round(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // If coupon was applied, increment its usage
      if (appliedCoupon) {
        const q = query(
          collection(db, 'coupons'),
          where('code', '==', appliedCoupon.code)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          await updateDoc(doc(db, 'coupons', snapshot.docs[0].id), {
            usedCount: increment(1)
          });
        }
      }

      await addDoc(collection(db, 'bluetick_requests'), {
        userEmail: user?.email,
        userId: user?.uid,
        plan,
        transactionId,
        couponApplied: appliedCoupon?.code || null,
        discountPercent: appliedCoupon?.percentOff || 0,
        finalAmount: getPrice(plan),
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      toast.success('Request submitted! Wait for admin approval.');
      navigate('/');
    } catch (error) {
      toast.error('Failed to submit request');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (hasPendingRequest) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-12">
          <Card className="max-w-md mx-auto border-2 border-yellow-500">
            <CardHeader className="text-center">
              <Clock className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
              <CardTitle>Request Pending</CardTitle>
              <CardDescription>
                Your King Badge purchase request is awaiting admin approval. You'll be notified once it's processed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')} className="w-full">
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Special Offers Section - Show at top */}
          {specialOffers.length > 0 && (
            <div className="mb-8 space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Special Offers</h2>
              </div>
              <div className="grid gap-4">
                {specialOffers.map(offer => (
                  <Card key={offer.id} className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-secondary/5 overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      {offer.imageUrl && (
                        <div className="md:w-1/3">
                          <img 
                            src={offer.imageUrl} 
                            alt={offer.title} 
                            className="w-full h-32 md:h-full object-cover"
                          />
                        </div>
                      )}
                      <div className={`p-4 flex-1 ${offer.imageUrl ? '' : 'w-full'}`}>
                        <h3 className="font-bold text-lg text-primary">{offer.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{offer.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="text-center mb-8">
            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
              <Crown className="h-8 w-8 text-white" fill="white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Get King Badge</h1>
            <p className="text-muted-foreground">
              Join our verified members and enjoy premium benefits
            </p>
          </div>

          {step === 'plan' && (
            <Card>
              <CardHeader>
                <CardTitle>Choose Your Plan</CardTitle>
                <CardDescription>Select a verification plan that suits you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup value={plan} onValueChange={setPlan}>
                  <div className={`flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:border-primary ${plan === 'weekly' ? 'border-primary bg-primary/5' : ''}`}>
                    <RadioGroupItem value="weekly" id="weekly" />
                    <Label htmlFor="weekly" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Weekly Plan</div>
                      <div className="text-2xl font-bold text-primary">₹{settings?.weeklyPrice || '29'}</div>
                      <div className="text-sm text-muted-foreground">Billed weekly</div>
                    </Label>
                  </div>
                  <div className={`flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:border-primary ${plan === 'monthly' ? 'border-primary bg-primary/5' : ''}`}>
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Monthly Plan</div>
                      <div className="text-2xl font-bold text-primary">₹{settings?.monthlyPrice || '99'}</div>
                      <div className="text-sm text-muted-foreground">Billed monthly</div>
                    </Label>
                  </div>
                  <div className={`flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:border-primary ${plan === 'yearly' ? 'border-primary bg-primary/5' : ''}`}>
                    <RadioGroupItem value="yearly" id="yearly" />
                    <Label htmlFor="yearly" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Yearly Plan</div>
                      <div className="text-2xl font-bold text-primary">₹{settings?.yearlyPrice || '999'}</div>
                      <div className="text-sm text-muted-foreground">Billed annually • Save more!</div>
                    </Label>
                  </div>
                </RadioGroup>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    Benefits of King Badge
                  </h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>✓ King badge on your profile</li>
                    <li>✓ No key generation required for downloads</li>
                    <li>✓ Access to premium content</li>
                    <li>✓ Priority support</li>
                  </ul>
                </div>

                <Button onClick={() => setStep('coupon')} className="w-full">
                  Continue
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 'coupon' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Have a Coupon?
                </CardTitle>
                <CardDescription>Apply a discount coupon if you have one</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div>
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        Coupon Applied: {appliedCoupon.code}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {appliedCoupon.percentOff}% discount applied
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={removeCoupon}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="couponCode">Coupon Code</Label>
                    <div className="flex gap-2">
                      <Input
                        id="couponCode"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code"
                        className="uppercase"
                      />
                      <Button onClick={applyCoupon} disabled={applyingCoupon}>
                        {applyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span>Selected Plan:</span>
                    <span className="font-semibold capitalize">{plan}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span>Original Price:</span>
                    <span>₹{plan === 'weekly' ? settings?.weeklyPrice : plan === 'monthly' ? settings?.monthlyPrice : settings?.yearlyPrice}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between items-center mt-2 text-green-600 dark:text-green-400">
                      <span>Discount ({appliedCoupon.percentOff}%):</span>
                      <span>-₹{Math.round((plan === 'weekly' ? parseFloat(settings?.weeklyPrice || '29') : plan === 'monthly' ? parseFloat(settings?.monthlyPrice || '99') : parseFloat(settings?.yearlyPrice || '999')) * appliedCoupon.percentOff / 100)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-2 pt-2 border-t font-bold text-lg">
                    <span>Final Amount:</span>
                    <span className="text-primary">₹{getPrice(plan)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep('plan')} className="flex-1">
                    Back
                  </Button>
                  <Button onClick={() => setStep('payment')} className="flex-1">
                    Continue to Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'payment' && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
                <CardDescription>Complete the payment using UPI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-card/50 border rounded-lg p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Scan QR Code to Pay</p>
                  <img 
                    src={settings?.qrCodeUrl} 
                    alt="QR Code" 
                    className="w-48 h-48 mx-auto mb-4 border rounded-lg"
                  />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-muted-foreground">Or pay to UPI ID:</p>
                    <p className="text-lg font-bold text-primary">{settings?.upiId}</p>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    <strong>Amount to Pay:</strong> ₹{getPrice(plan)}
                    {appliedCoupon && (
                      <span className="ml-2 text-green-600 dark:text-green-400">
                        ({appliedCoupon.percentOff}% off applied)
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep('coupon')} className="flex-1">
                    Back
                  </Button>
                  <Button onClick={() => setStep('confirm')} className="flex-1">
                    I've Completed Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'confirm' && (
            <Card>
              <CardHeader>
                <CardTitle>Confirm Payment</CardTitle>
                <CardDescription>Enter your transaction ID to complete</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="transactionId">Transaction ID / UPI Reference ID *</Label>
                    <Input
                      id="transactionId"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Enter your transaction ID"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      You can find this in your UPI app's transaction history
                    </p>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      ℹ️ Your request will be reviewed by admin. You'll receive verification once approved.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setStep('payment')} className="flex-1">
                      Back
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1">
                      <CreditCard className="h-4 w-4 mr-2" />
                      {loading ? 'Submitting...' : 'Submit Request'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlueTickPurchase;
