import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Mail, Calendar, Users, Database, Eye } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy | NHSF (UK) Dharmic Games',
  description: 'Privacy Policy for NHSF (UK) Dharmic Games - How we collect, use, and protect your personal data in our Zonal & National Competition.',
  keywords: ['privacy policy', 'NHSF UK', 'Dharmic Games', 'data protection', 'GDPR'],
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-xl text-gray-600">
              NHSF (UK) Dharmic Games - Zonal & National Competition
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {new Date().toLocaleDateString('en-GB', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          {/* Privacy Policy Content */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-600" />
                Who are we?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                National Hindu Students' Forum (UK) (hereinafter referred to as NHSF (UK)) is the "data controller" 
                for the purposes of the Data Protection Act 1998 and (from 25th May 2018) the EU General Data 
                Protection Regulation 2016/679 ("Data Protection Law"). This means that we are responsible for, 
                and control the processing of, your personal information.
              </p>
              <p>
                This privacy policy specifically covers the NHSF (UK) Dharmic Games - our premier Zonal & National 
                Competition platform that brings together students from across the UK in exciting challenges.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-orange-600" />
                What personal data we collect about you?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>We may collect personal information including (non-exhaustive list):</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Registration Information:</strong> Your name, email address, university name, contact details, and date of birth when you register for the Dharmic Games</li>
                <li><strong>Competition Data:</strong> Your sports preferences, team affiliations, match results, and performance statistics</li>
                <li><strong>University Details:</strong> University name, zone, contact person information, and sports teams when registering as a university</li>
                <li><strong>Event Participation:</strong> Your responses to event registrations, attendance records, and competition participation</li>
                <li><strong>Communication Data:</strong> Messages and responses via email, feedback, and support requests</li>
                <li><strong>Technical Data:</strong> IP address, browser type, device information, and website usage analytics</li>
                <li><strong>Media Content:</strong> Images and videos from competition events for promotional purposes</li>
              </ul>
              <p className="text-sm text-gray-600 mt-4">
                This includes collecting information about yourself if you sign up to the Dharmic Games by linking 
                your email address to NHSF (UK) via our competition platform or third-party websites.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-orange-600" />
                Why we use your personal data?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>We use your personal data for the following purposes:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Competition Management:</strong> To organize and administer the Dharmic Games, including team registrations, match scheduling, and results tracking</li>
                <li><strong>Communication:</strong> To keep you informed about competition updates, match schedules, results, and related activities</li>
                <li><strong>Administrative Tasks:</strong> To maintain attendance registers, issue certificates, and manage competition logistics</li>
                <li><strong>Public Relations:</strong> To promote the Dharmic Games and showcase participant achievements</li>
                <li><strong>Record Keeping:</strong> To maintain records of your participation in the competition</li>
                <li><strong>Analytics:</strong> To analyze competition participation and improve our services</li>
                <li><strong>Safety & Security:</strong> To ensure the safety and security of all participants</li>
              </ul>
              <p className="text-sm text-gray-600 mt-4">
                We do not sell or share your personal details to third parties for marketing purposes. However, 
                if we run an event in partnership with another organization, your details may need to be shared, 
                and you will be notified in such circumstances.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-600" />
                Sharing your personal data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                The personal information we collect about you will be used by us for the purposes listed above. 
                We will never sell or share your personal information with organizations so that they can contact 
                you for any marketing activities.
              </p>
              <p>
                NHSF (UK) may, however, share your information with our trusted partners and suppliers who work 
                with us to deliver the Dharmic Games, but processing of this information is always carried out 
                under our instruction. Examples include:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Event venues and facilities for competition logistics</li>
                <li>Sports officials and referees for match management</li>
                <li>Media partners for competition coverage (with your consent)</li>
                <li>Technical service providers for platform maintenance</li>
              </ul>
              <p className="text-sm text-gray-600 mt-4">
                We may disclose your information if required to do so by law or in order to enforce our 
                competition terms and conditions.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                How long do we keep your personal data?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                We only keep your personal data as long as is reasonable and necessary for the relevant 
                competition activities. This typically includes:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li><strong>Active Competition Period:</strong> Throughout the competition season and immediate follow-up</li>
                <li><strong>Historical Records:</strong> Competition results and achievements may be retained for historical purposes</li>
                <li><strong>Legal Requirements:</strong> As required by applicable laws and regulations</li>
                <li><strong>Communication Records:</strong> Email communications may be retained for administrative purposes</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-600" />
                Your rights and your personal data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Unless subject to an exemption, you have the following rights with respect to your personal data:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Access:</strong> The right to request a copy of your personal data which NHSF (UK) holds about you</li>
                <li><strong>Rectification:</strong> The right to request us to correct or change any personal data if it is found to be inaccurate or out-of-date</li>
                <li><strong>Right to object:</strong> You can object to our processing of your personal information where we are relying on a legitimate interest</li>
                <li><strong>Restriction:</strong> The right to request a restriction is placed on further processing where there is a dispute in relation to the accuracy or processing of your personal data</li>
                <li><strong>Erasure:</strong> The right to request your personal data is erased where it is no longer necessary for NHSF (UK) to retain such data</li>
              </ul>
              <p className="text-sm text-gray-600 mt-4">
                Please make all requests for access via our email address provided below, and provide us with 
                evidence of your identity. We will provide access without delay, and at latest, within one month 
                of receipt of your request.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-orange-600" />
                Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                To exercise all relevant rights, queries or complaints regarding your personal data in relation 
                to the NHSF (UK) Dharmic Games, please contact us:
              </p>
              <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                <p className="font-medium text-orange-800">Email: info@nhsf.org.uk</p>
                <p className="text-sm text-orange-700 mt-1">
                  Please include "Dharmic Games Privacy" in your subject line for faster processing.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Changes to our Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                We shall review this policy from time to time and may update it. If we do so, the updated 
                version will be uploaded on to the website, and will be effective from the moment it is 
                uploaded, so please check it from time to time.
              </p>
              <p className="text-sm text-gray-600 mt-4">
                <strong>Version 1.0</strong> - Updated for NHSF (UK) Dharmic Games: {new Date().toLocaleDateString('en-GB', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-12 p-6 bg-white rounded-lg shadow-sm">
            <p className="text-sm text-gray-600">
              This privacy policy is specifically tailored for the NHSF (UK) Dharmic Games platform. 
              For our general privacy policy, please visit{' '}
              <a 
                href="https://www.nhsf.org.uk/privacy-policy-2/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-orange-600 hover:text-orange-700 underline"
              >
                nhsf.org.uk/privacy-policy-2/
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
