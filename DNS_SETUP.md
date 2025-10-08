# 🌐 DNS Setup Guide: tester.upswitch.biz

## 🎯 **Quick Setup for Vercel**

### **Step 1: Deploy to Vercel**
```bash
cd /Users/matthiasmandiau/Downloads/upswitch/apps/upswitch-valuation-tester
npm run deploy:vercel
```

### **Step 2: Add Custom Domain in Vercel**
1. Go to your Vercel dashboard
2. Select your project (`upswitch-tester`)
3. Go to "Settings" → "Domains"
4. Add domain: `tester.upswitch.biz`
5. Vercel will show you the DNS records to add

### **Step 3: Configure DNS Records**

#### **For Vercel (Recommended)**
Add this CNAME record in your DNS provider:
```
Type: CNAME
Name: tester
Value: cname.vercel-dns.com
TTL: 300
```

#### **Alternative: A Record**
If CNAME doesn't work, use these A records:
```
Type: A
Name: tester
Value: 76.76.19.61
TTL: 300

Type: A
Name: tester
Value: 76.76.21.61
TTL: 300
```

---

## 🔧 **DNS Provider Specific Instructions**

### **Cloudflare**
1. Go to DNS → Records
2. Click "Add record"
3. Type: `CNAME`
4. Name: `tester`
5. Target: `cname.vercel-dns.com`
6. TTL: `Auto`
7. Click "Save"

### **GoDaddy**
1. Go to "My Products" → "DNS"
2. Click "Manage" next to your domain
3. Click "Add" in the DNS Records section
4. Type: `CNAME`
5. Host: `tester`
6. Points to: `cname.vercel-dns.com`
7. TTL: `1 Hour`
8. Click "Save"

### **Namecheap**
1. Go to "Domain List" → "Manage"
2. Go to "Advanced DNS" tab
3. Click "Add New Record"
4. Type: `CNAME Record`
5. Host: `tester`
6. Value: `cname.vercel-dns.com`
7. TTL: `5 min`
8. Click "Save"

### **Route 53 (AWS)**
1. Go to Route 53 → Hosted zones
2. Select your domain
3. Click "Create record"
4. Record name: `tester`
5. Record type: `CNAME`
6. Value: `cname.vercel-dns.com`
7. TTL: `300`
8. Click "Create records"

---

## ⏱️ **DNS Propagation Timeline**

- **Immediate**: Changes saved in DNS provider
- **5-15 minutes**: Most users can access the subdomain
- **24-48 hours**: Full global propagation
- **Test**: Use `nslookup tester.upswitch.biz` to verify

---

## 🧪 **Testing Your Subdomain**

### **1. Check DNS Propagation**
```bash
# Check if DNS is working
nslookup tester.upswitch.biz

# Should return Vercel IP addresses
dig tester.upswitch.biz
```

### **2. Test in Browser**
- Visit `https://tester.upswitch.biz`
- Should redirect to your Vercel deployment
- Check SSL certificate is working

### **3. Verify SSL**
- Look for 🔒 lock icon in browser
- Certificate should be valid for `tester.upswitch.biz`

---

## 🔒 **SSL Certificate**

Vercel automatically provides SSL certificates for custom domains:
- **Automatic**: Vercel handles SSL setup
- **Let's Encrypt**: Free SSL certificates
- **Auto-renewal**: Certificates renew automatically
- **HTTPS Redirect**: HTTP automatically redirects to HTTPS

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Domain not found"**
**Solution**: Wait for DNS propagation (up to 48 hours)

### **Issue 2: "SSL Certificate Error"**
**Solution**: Wait for Vercel to provision SSL (5-10 minutes)

### **Issue 3: "CNAME not allowed"**
**Solution**: Use A records instead of CNAME

### **Issue 4: "Subdomain not working"**
**Solution**: 
1. Check DNS record is correct
2. Verify domain is added in Vercel
3. Wait for propagation
4. Clear browser cache

---

## 📋 **Verification Checklist**

- [ ] DNS record added (CNAME or A record)
- [ ] Domain added in Vercel dashboard
- [ ] SSL certificate provisioned
- [ ] Subdomain accessible in browser
- [ ] HTTPS redirect working
- [ ] Analytics tracking active

---

## 🎯 **Next Steps After DNS Setup**

1. **Deploy your app**: `npm run deploy:vercel`
2. **Add custom domain**: In Vercel dashboard
3. **Wait for SSL**: 5-10 minutes
4. **Test thoroughly**: All features working
5. **Set up analytics**: Google Analytics, etc.
6. **Monitor performance**: Track key metrics

---

**Your subdomain `tester.upswitch.biz` will be live once DNS propagates! 🚀**
