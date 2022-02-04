import { Request, Response } from 'express'
import { Endpoint } from '../base/Endpoint'

@Endpoint.API()
export class Documents {

  @Endpoint.GET()
  public async privacy(_: Request, res: Response): Promise<any> {
    return res.send({ document: `# PRIVACY POLICY

Your privacy is important to us, so TeleDrive, a Indonesia, has created the following Privacy Policy ("Policy") to let you know what information we collect when you visit our Site https://teledriveapp.com ("Site"), why we collect it and how we use it.

The terms "You," "Your," "Yours" and "User" refer to the entity/person/organization using our Site.
When this Policy mentions "We", "Us," and "Our" it refers to TeleDrive and its subsidiaries and affiliates.


This Privacy Policy is governed by our [Terms of Services](https://teledriveapp.com/terms).

For any questions regarding this Policy or any requests regarding the processing of personal data, please contact us at support@teledriveapp.com.

## 1. INFORMATION WE COLLECT FROM YOU
We collect the information You provide to us and this information is necessary for the adequate performance of the contractual arrangement which is in place between You and us and allow us to comply with our legal obligations.

  - Account Signup Information. When You create the account, we ask You to provide the signup information, such as Email, Name, Username.
  - Login information. We collect Login information if You are logging to our account with Authentication Data.
  - Other Personal Information Provided by You. We may collect other data provided by You from surveys, feedback, financial information (purchase history), Message ID That Contains Media and Document and other similar data.



## 2. INFORMATION WE COLLECT AUTOMATICALLY
When you use our Site or contact us directly we may collect information, including your personal information, about the way you act in our Site, the services You use and how You use them.
This information is necessary for the adequate performance of the contract between You and us, to enable us to comply with legal obligations and given our legitimate interest in being able to provide and improve the functionalities of the Site.

  - Log data and Device information. We automatically collect log data and device information when you access and use the Site, even if you have not created an Account or logged in. That information includes, among other things: Internet protocol (IP) addresses, Browser type, Operating system, Date/time stamp.
  - Tracking technologies and Cookies. We use Cookies. We also automatically collect information about device’s operating system, .



## 3. THE WAY WE USE YOUR INFORMATION
We process your information adhering to the general data processing principles.
We may use the information we collect through our Site for a number of reasons, including to:

  - to identify user
  - to create account
  - to create trusted environment
  - to create statistics and analyze market
  - to stay connected
  - to send billing information
  - to manage user orders
  - to contact user
  - to improve services
  - to ensure data security and prevent fraud
  - to comply with applicable laws
  - to request feedback
  - to post testimonials
  - to provide support

We will normally collect personal information from you only where we have your consent to do so, where we need the personal information to perform a contract with you, or where the processing is in our legitimate business interests.


## 4. COOKIES
Cookies are small text files stored by your browser on your computer when you visit our Site. We use cookies to improve our Site and make it easier to use. Cookies permit us to recognize users and avoid repetitive requests for the same information.
Cookies from our Site cannot be read by other Sites. Most browsers will accept cookies unless you change your browser settings to refuse them.
Cookies we use on our Site:

  - Strictly necessary cookies - These cookies are required for the operation of our Site. They help us to show you the right information, customize your experience, and allow us to implement and maintain security features as well as to help us detect malicious activities. Without these cookies operation of the Website would be impossible or its functioning may be severely affected.

You may find more information about how to delete cookies, as well as the other useful information related to the use of the cookies, on the website http://www.allaboutcookies.org/.


## 5. SENSITIVE INFORMATION
We do not collect sensitive information such as political opinions, religious or philosophical beliefs, racial or ethnic origin, genetic data, biometric data, health data or data related a sexual orientation.
Please do not send, upload, or provide us any sensitive data and contact us using the contact details below if you believe that we might have such information. We have a right to delete any information we believe it might contain sensitive data.


## 6. PAYMENT INFORMATION
To order and use our services we may require you to provide certain financial information to facilitate the processing of payments. We will not store or collect your payment card details. That information is provided directly to our third-party payment processors whose use of your Personal information is governed by their Privacy Policy. All payment data is stored by . You may find their privacy policy link(s) here: .


## 7. THIRD PARTY LINKS
Our Site may have links to other websites. Please review their privacy policies to learn more about how they collect and use your personal data, because we do not control their policies and personal data processing practices.


## 8. RETENTION
We retain your personal information to provide services to you and as otherwise necessary to comply with our legal obligation, resolve disputes, and enforce our agreements.
We will retain your personal information as long as we need it to provide services to you, unless we are otherwise required by law or regulations to retain your personal information longer.


## 9. SECURITY
We have implemented security measures designed to protect the personal information you share with us, including physical, electronic and procedural measures. Among other things, we regularly monitor our systems for possible vulnerabilities and attacks.
Regardless of the measures and efforts taken by us, the transmission of information via internet, email or text message is not completely secure. We do not guarantee the absolute protection and security of your personal information.
We therefore encourage you to avoid providing us or anyone with any sensitive information of which you believe its disclosure could cause you substantial or irreparable harm.
If you have any questions regarding the security of our Site or Services, you are welcome to contact us at security@teledriveapp.com.


## 10. YOUR RIGHTS
You are entitled to a range of rights regarding the protection of your personal information. Those rights are:

  - The right to access the information we have about you. If you wish to access your personal information that we collect, you can do so at any time by contacting us using the contact details provided below.
  - The right to rectify inaccurate information about you. You can correct, update or request deletion of your personal information by contacting us using the contact details provided below.
  - The right to object the processing. When we rely on your consent to process your personal information, you may withdraw consent at any time by contacting us using the contact details provided below. This will not affect the lawfulness of processing prior to the withdrawal of your consent.
  - The right to lodge a complaint. You can raise questions or complaints to the national Data Protection Agency in your country of residence in the event where your rights may have been infringed. However, we recommend attempting to reach a peaceful resolution of the possible dispute by contacting us first.
  - The right to erase any data concerning you. You may demand erasure of data without undue delay for legitimate reasons, e.g. where data is no longer necessary for the purposes it was collected, or where the data has been unlawfully processed.



## 11. APPLICATION OF POLICY
This Policy was created with the help of the [TermsHub.io](https://termshub.io?utm_source=referral&utm_medium=generated_documents&utm_campaign=referral_documents&utm_content=pp_th_text) and the [Privacy Policy Generator](https://termshub.io/privacy-policy?utm_source=referral&utm_medium=generated_documents&utm_campaign=referral_documents&utm_content=pp_th_text) and applies only to the services offered by our Company. Our Policy does not apply to services offered by other companies or individuals, including products or sites that may be displayed to you in search results, sites that may include our services or other sites linked from our Site or Services.


## 12. AMENDMENTS
Our Policy may change from time to time. We will post any Policy changes on our Site and, if the changes are significant, we may consider providing a more explicit notice (including, for certain services, email notification of Policy changes).


## 13. ACCEPTANCE OF THIS POLICY
We assume that all Users of this Site have carefully read this document and agree to its contents. If someone does not agree with this Policy, they should refrain from using our Site. We reserve the right to change our Policy at any time and inform by using the way as indicated in Section 12. Continued use of this Site implies acceptance of the revised Policy.


## 14. FURTHER INFORMATION
If you have any further questions regarding the data we collect, or how we use it, then please feel free to contact us at the details as indicated above.

` })
  }

  @Endpoint.GET()
  public async tos(_: Request, res: Response): Promise<any> {
    return res.send({ document: `# TERMS OF SERVICES

PLEASE READ THIS TERMS OF SERVICE AGREEMENT CAREFULLY, AS IT CONTAINS IMPORTANT INFORMATION REGARDING YOUR LEGAL RIGHTS AND REMEDIES.

Last Revised: 2021-09-15 04:28:11

## 1. OVERVIEW
This Terms of Service Agreement ("Agreement") is entered into by and between TeleDrive, registered address South Jakarta, Indonesia, Indonesia ("Company") and you, and is made effective as of the date of your use of this website https://teledriveapp.com ("Site") or the date of electronic acceptance.
This Agreement sets forth the general terms and conditions of your use of the https://teledriveapp.com as well as the products and/or services purchased or accessed through this Site (the "Services").Whether you are simply browsing or using this Site or purchase Services, your use of this Site and your electronic acceptance of this Agreement signifies that you have read, understand, acknowledge and agree to be bound by this Agreement our [Privacy policy](https://teledriveapp.com/privacy). The terms "we", "us" or "our" shall refer to Company. The terms "you", "your", "User" or "customer" shall refer to any individual or entity who accepts this Agreement, uses our Site, has access or uses the Services. Nothing in this Agreement shall be deemed to confer any third-party rights or benefits.
Company may, in its sole and absolute discretion, change or modify this Agreement, and any policies or agreements which are incorporated herein, at any time, and such changes or modifications shall be effective immediately upon posting to this Site. Your use of this Site or the Services after such changes or modifications have been made shall constitute your acceptance of this Agreement as last revised.
IF YOU DO NOT AGREE TO BE BOUND BY THIS AGREEMENT AS LAST REVISED, DO NOT USE (OR CONTINUE TO USE) THIS SITE OR THE SERVICES.


## 2. ELIGIBILITY
This Site and the Services are available only to Users who can form legally binding contracts under applicable law. By using this Site or the Services, you represent and warrant that you are (i) at least eighteen (18) years of age, (ii) otherwise recognized as being able to form legally binding contracts under applicable law, and (iii) are not a person barred from purchasing or receiving the Services found under the laws of the Indonesia or other applicable jurisdiction.
If you are entering into this Agreement on behalf of a company or any corporate entity, you represent and warrant that you have the legal authority to bind such corporate entity to the terms and conditions contained in this Agreement, in which case the terms "you", "your", "User" or "customer" shall refer to such corporate entity. If, after your electronic acceptance of this Agreement, Company finds that you do not have the legal authority to bind such corporate entity, you will be personally responsible for the obligations contained in this Agreement.


## 3. RULES OF USER CONDUCT
By using this Site You acknowledge and agree that:

- Your use of this Site, including any content you submit, will comply with this Agreement and all applicable local, state, national and international laws, rules and regulations.

You will not use this Site in a manner that:

- Is illegal, or promotes or encourages illegal activity;
- Promotes, encourages or engages in child pornography or the exploitation of children;
- Promotes, encourages or engages in terrorism, violence against people, animals, or property;
- Promotes, encourages or engages in any spam or other unsolicited bulk email, or computer or network hacking or cracking;
- Infringes on the intellectual property rights of another User or any other person or entity;
- Violates the privacy or publicity rights of another User or any other person or entity, or breaches any duty of confidentiality that you owe to another User or any other person or entity;
- Interferes with the operation of this Site;
- Contains or installs any viruses, worms, bugs, Trojan horses, Cryptocurrency Miners or other code, files or programs designed to, or capable of, using many resources, disrupting, damaging, or limiting the functionality of any software or hardware.

You will not:

- copy or distribute in any medium any part of this Site, except where expressly authorized by Company,
- copy or duplicate this Terms of Services agreement, which was created with the help of the [TermsHub.io](https://termshub.io?utm_source=referral&utm_medium=generated_documents&utm_campaign=referral_documents&utm_content=tos_th_text) and the [Terms and Conditions](https://termshub.io/terms-of-service?utm_source=referral&utm_medium=generated_documents&utm_campaign=referral_documents&utm_content=tos_th_text) Generator,
- modify or alter any part of this Site or any of its related technologies,
- access Companies Content (as defined below) or User Content through any technology or means other than through this Site itself.



## 4. INTELLECTUAL PROPERTY
In addition to the general rules above, the provisions in this Section apply specifically to your use of Companies Content posted to Site. Companies Content on this Site, including without limitation the text, software, scripts, source code, API, graphics, photos, sounds, music, videos and interactive features and the trademarks, service marks and logos contained therein ("Companies Content"), are owned by or licensed to TeleDrive in perpetuity, and are subject to copyright, trademark, and/or patent protection.
Companies Content is provided to you "as is", "as available" and "with all faults" for your information and personal, non-commercial use only and may not be downloaded, copied, reproduced, distributed, transmitted, broadcast, displayed, sold, licensed, or otherwise exploited for any purposes whatsoever without the express prior written consent of Company. No right or license under any copyright, trademark, patent, or other proprietary right or license is granted by this Agreement.


## 5. YOUR USE OF USER CONTENT
Some of the features of this Site may allow Users to view, post, publish, share, or manage (a) ideas, opinions, recommendations, or advice ("User Submissions"), or (b) literary, artistic, musical, or other content, including but not limited to photos and videos (together with User Submissions, "User Content"). By posting or publishing User Content to this Site, you represent and warrant to Company that (i) you have all necessary rights to distribute User Content via this Site or via the Services, either because you are the author of the User Content and have the right to distribute the same, or because you have the appropriate distribution rights, licenses, consents, and/or permissions to use, in writing, from the copyright or other owner of the User Content, and (ii) the User Content does not violate the rights of any third party.
You agree not to circumvent, disable or otherwise interfere with the security-related features of this Site (including without limitation those features that prevent or restrict use or copying of any Companies Content or User Content) or enforce limitations on the use of this Site, the Companies Content or the User Content therein.



## 6. LINKS TO THIRD-PARTY WEBSITES
This Site may contain links to third-party websites that are not owned or controlled by Company. Company assumes no responsibility for the content, terms and conditions, privacy policies, or practices of any third-party websites. In addition, Company does not censor or edit the content of any third-party websites. By using this Site you expressly release Company from any and all liability arising from your use of any third-party website. Accordingly, Company encourages you to be aware when you leave this Site and to review the terms and conditions, privacy policies, and other governing documents of each other website that you may visit.


## 7. DISCLAIMER OF REPRESENTATIONS AND WARRANTIES
YOU SPECIFICALLY ACKNOWLEDGE AND AGREE THAT YOUR USE OF THIS SITE SHALL BE AT YOUR OWN RISK AND THAT THIS SITE ARE PROVIDED "AS IS", "AS AVAILABLE" AND "WITH ALL FAULTS". COMPANY, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, DISCLAIM ALL WARRANTIES, STATUTORY, EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, ANY IMPLIED WARRANTIES OF TITLE, MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. COMPANY, ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS MAKE NO REPRESENTATIONS OR WARRANTIES ABOUT (I) THE ACCURACY, COMPLETENESS, OR CONTENT OF THIS SITE, (II) THE ACCURACY, COMPLETENESS, OR CONTENT OF ANY SITES LINKED (THROUGH HYPERLINKS, BANNER ADVERTISING OR OTHERWISE) TO THIS SITE, AND/OR (III) THE SERVICES FOUND AT THIS SITE OR ANY SITES LINKED (THROUGH HYPERLINKS, BANNER ADVERTISING OR OTHERWISE) TO THIS SITE, AND COMPANY ASSUMES NO LIABILITY OR RESPONSIBILITY FOR THE SAME.
IN ADDITION, YOU SPECIFICALLY ACKNOWLEDGE AND AGREE THAT NO ORAL OR WRITTEN INFORMATION OR ADVICE PROVIDED BY COMPANY, ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS, AND THIRD-PARTY SERVICE PROVIDERS WILL (I) CONSTITUTE LEGAL OR FINANCIAL ADVICE OR (II) CREATE A WARRANTY OF ANY KIND WITH RESPECT TO THIS SITE OR THE SERVICES FOUND AT THIS SITE, AND USERS SHOULD NOT RELY ON ANY SUCH INFORMATION OR ADVICE.
THE FOREGOING DISCLAIMER OF REPRESENTATIONS AND WARRANTIES SHALL APPLY TO THE FULLEST EXTENT PERMITTED BY LAW, and shall survive any termination or expiration of this Agreement or your use of this Site or the Services found at this Site.


## 8. LIMITATION OF LIABILITY
IN NO EVENT SHALL COMPANY, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND ALL THIRD PARTY SERVICE PROVIDERS, BE LIABLE TO YOU OR ANY OTHER PERSON OR ENTITY FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, PUNITIVE, OR CONSEQUENTIAL DAMAGES WHATSOEVER, INCLUDING ANY DAMAGES THAT MAY RESULT FROM (I) THE ACCURACY, COMPLETENESS, OR CONTENT OF THIS SITE, (II) THE ACCURACY, COMPLETENESS, OR CONTENT OF ANY SITES LINKED (THROUGH HYPERLINKS, BANNER ADVERTISING OR OTHERWISE) TO THIS SITE, (III) THE SERVICES FOUND AT THIS SITE OR ANY SITES LINKED (THROUGH HYPERLINKS, BANNER ADVERTISING OR OTHERWISE) TO THIS SITE, (IV) PERSONAL INJURY OR PROPERTY DAMAGE OF ANY NATURE WHATSOEVER, (V) THIRD-PARTY CONDUCT OF ANY NATURE WHATSOEVER, (VI) ANY INTERRUPTION OR CESSATION OF SERVICES TO OR FROM THIS SITE OR ANY SITES LINKED (THROUGH HYPERLINKS, BANNER ADVERTISING OR OTHERWISE) TO THIS SITE, (VII) ANY VIRUSES, WORMS, BUGS, TROJAN HORSES, OR THE LIKE, WHICH MAY BE TRANSMITTED TO OR FROM THIS SITE OR ANY SITES LINKED (THROUGH HYPERLINKS, BANNER ADVERTISING OR OTHERWISE) TO THIS SITE, (VIII) ANY USER CONTENT OR CONTENT THAT IS DEFAMATORY, HARASSING, ABUSIVE, HARMFUL TO MINORS OR ANY PROTECTED CLASS, PORNOGRAPHIC, "X-RATED", OBSCENE OR OTHERWISE OBJECTIONABLE, AND/OR (IX) ANY LOSS OR DAMAGE OF ANY KIND INCURRED AS A RESULT OF YOUR USE OF THIS SITE OR THE SERVICES FOUND AT THIS SITE, WHETHER BASED ON WARRANTY, CONTRACT, TORT, OR ANY OTHER LEGAL OR EQUITABLE THEORY, AND WHETHER OR NOT COMPANY IS ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
IN ADDITION, You SPECIFICALLY ACKNOWLEDGE AND agree that any cause of action arising out of or related to this Site or the Services found at this Site must be commenced within one (1) year after the cause of action accrues, otherwise such cause of action shall be permanently barred.
THE FOREGOING LIMITATION OF LIABILITY SHALL APPLY TO THE FULLEST EXTENT PERMITTED BY LAW, AND shall survive any termination or expiration of this Agreement or your use of this Site or the Services found at this Site.


## 9. INDEMNITY
You agree to protect, defend, indemnify and hold harmless Company and its officers, directors, employees, agents from and against any and all claims, demands, costs, expenses, losses, liabilities and damages of every kind and nature (including, without limitation, reasonable attorneys’ fees) imposed upon or incurred by Company directly or indirectly arising from (i) your use of and access to this Site; (ii) your violation of any provision of this Agreement or the policies or agreements which are incorporated herein; and/or (iii) your violation of any third-party right, including without limitation any intellectual property or other proprietary right. The indemnification obligations under this section shall survive any termination or expiration of this Agreement or your use of this Site or the Services found at this Site.


## 10. DATA TRANSFER
If you are visiting this Site from a country other than the country in which our servers are located, your communications with us may result in the transfer of information across international boundaries. By visiting this Site and communicating electronically with us, you consent to such transfers.


## 11. AVAILABILITY OF WEBSITE
Subject to the terms and conditions of this Agreement and our policies, we shall use commercially reasonable efforts to attempt to provide this Site on 24/7 basis. You acknowledge and agree that from time to time this Site may be inaccessible for any reason including, but not limited to, periodic maintenance, repairs or replacements that we undertake from time to time, or other causes beyond our control including, but not limited to, interruption or failure of telecommunication or digital transmission links or other failures.
You acknowledge and agree that we have no control over the availability of this Site on a continuous or uninterrupted basis, and that we assume no liability to you or any other party with regard thereto.


## 12. DISCONTINUED SERVICES
Company reserves the right to cease offering or providing any of the Services at any time, for any or no reason, and without prior notice. Although Company makes great effort to maximize the lifespan of all its Services, there are times when a Service we offer will be discontinued. If that is the case, that product or service will no longer be supported by Company. In such case, Company will either offer a comparable Service for you to migrate to or a refund. Company will not be liable to you or any third party for any modification, suspension, or discontinuance of any of the Services we may offer or facilitate access to.


## 13. FEES AND PAYMENTS
You acknowledge and agree that your payment will be charged and processed by TeleDrive.
You agree to pay any and all prices and fees due for Services purchased or obtained at this Site at the time you order the Services.
Company expressly reserves the right to change or modify its prices and fees at any time, and such changes or modifications shall be posted online at this Site and effective immediately without need for further notice to you.
Refund Policy: for products and services eligible for a refund, you may request a refund under the terms and conditions of our Refund Policy which can be accessed [here.](https://portal.termshub.com/teledrive.vercel.app#refund_policy)


## 14. NO THIRD-PARTY BENEFICIARIES
Nothing in this Agreement shall be deemed to confer any third-party rights or benefits.


## 15. COMPLIANCE WITH LOCAL LAWS
Company makes no representation or warranty that the content available on this Site are appropriate in every country or jurisdiction, and access to this Site from countries or jurisdictions where its content is illegal is prohibited. Users who choose to access this Site are responsible for compliance with all local laws, rules and regulations.


## 16. GOVERNING LAW
This Agreement and any dispute or claim arising out of or in connection with it or its subject matter or formation shall be governed by and construed in accordance with the laws of Indonesia, DKI Jakarta, to the exclusion of conflict of law rules.


## 17. DISPUTE RESOLUTION
Any controversy or claim arising out of or relating to these Terms of Services will be settled by binding arbitration. Any such controversy or claim must be arbitrated on an individual basis, and must not be consolidated in any arbitration with any claim or controversy of any other party. The arbitration must be conducted in Indonesia, DKI Jakarta, and judgment on the arbitration award may be entered into any court having jurisdiction thereof.


## 18. TITLES AND HEADINGS
The titles and headings of this Agreement are for convenience and ease of reference only and shall not be utilized in any way to construe or interpret the agreement of the parties as otherwise set forth herein.


## 19. SEVERABILITY
Each covenant and agreement in this Agreement shall be construed for all purposes to be a separate and independent covenant or agreement. If a court of competent jurisdiction holds any provision (or portion of a provision) of this Agreement to be illegal, invalid, or otherwise unenforceable, the remaining provisions (or portions of provisions) of this Agreement shall not be affected thereby and shall be found to be valid and enforceable to the fullest extent permitted by law.


## 20. CONTACT INFORMATION
If you have any questions about this Agreement, please contact us by email or regular mail at the following address:
TeleDrive
South Jakarta, Indonesia
Indonesia
support@teledriveapp.com` })
  }

  @Endpoint.GET()
  public async refund(_: Request, res: Response): Promise<any> {
    return res.send({ document: `# REFUND POLICY

All our clients are very important to us, that's why TeleDrive ("Company"), has created the following Refund Policy to let You know how we handle the refunds for the goods ordered and bought on our website https://teledriveapp.com ("Website").
The terms "You," "Your," and "Yours" refer to the entity/ person/ organization using our Website. When this Policy mentions "we", "us,", and "our" it refers to the Company and its subsidiaries or /and affiliates. The term "goods" refer to any product or item bought on our Website by You.
This Refund Policy is governed by our [Terms of Services](https://teledriveapp.com/terms).
For any questions regarding this Refund Policy or any requests regarding the refunds and returns, please contact us by email refund@teledriveapp.com or other contacts provided below.
You have the right, without giving a reason, to return the goods within 14 days, if it has not been used, damaged or its appearance has not substantially changed, that is, the appearance of the product or its packaging has been made only such alterations as were necessary to inspect the goods received.
The right to withdraw from a distance contract within 14 days without giving a reason does not apply to legal persons (e.g. companies, entrepreneurs).
This Return policy does not limit Your statutory rights to withdraw or rights You may have in relation to incorrect, damaged or defective goods.


## Standard Returns
Any goods that You wish to return must be in the original packaging and unopened, in a condition fit for resale. If the Goods to be returned do not meet these conditions, we will be unable to offer a refund.
You must place your refund request within 14 days of delivery of the item.
Please contact our Support to begin the return and refund process, Support team will walk you through the process and help you.
In case of the return of the goods, you will be responsible for paying the return shipping costs.
You must exercise return right responsibly and return the product in the original neat packaging, as well as return all complete parts of the product. You are responsible for the complete set of the returned goods. If the goods are not complete, we won't be able to accept the returned goods and issue a refund.
Once the Goods have been received and checked by our staff, a refund will be authorised by the same method that the payment was made. Depending on your financial institution, refunds can take up to 30 days to be credited to your original payment method. In all cases we have the right to suspend the refund until the good are received back and inspected.
If You fail to meet the deadlines of our Return policy, we will be unable to offer a refund.


## Defective goods
In certain cases, such as defective, damaged or wrong goods, you may be required to provide evidence of the issue, such as a photo or video, or to return the item to receive a refund.
You must contact our company at refund@teledriveapp.com within 14 days upon purchase and provide detailed information, such as:

  - Proof of purchase
  - Order number

When submitting a complaint, You must indicate how You wish the claim to be resolved:

  - To refund the money paid

In case You are required to return the goods back to us, You will be responsible for paying the return shipping costs.
The goods must be returned in the original packaging (with instructions and/or warranty card, if they were delivered with the product).


## Further information
This Policy was created with the help of the [TermsHub.io](https://termshub.io?utm_source=referral&utm_medium=generated_documents&utm_campaign=referral_documents&utm_content=pp_th_text) and the [Refund & Return Policy Generator](https://termshub.io/refund-policy) and applies only to the refunds for the goods and services sold by our Company. Our Policy does not apply to the refunds for the goods and services offered by other companies or individuals.` })
  }
}
