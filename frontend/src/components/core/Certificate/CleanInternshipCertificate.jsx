import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { formatDate } from '../../../utils/dateFormatter';

export default function CleanInternshipCertificate({ certificateData }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    const generateQR = async () => {
      if (certificateData?.certificateId) {
        try {
          const url = await QRCode.toDataURL(
            `${window.location.origin}/verify-certificate/${certificateData.certificateId}`
          );
          setQrCodeUrl(url);
        } catch (err) {
          console.error('Error generating QR code:', err);
        }
      }
    };
    generateQR();
  }, [certificateData?.certificateId]);

  return (
    <div 
      className="relative bg-gradient-to-br from-blue-600 to-blue-800 p-8"
      style={{ width: '842px', height: '595px', margin: '0 auto' }}
    >
      {/* Outer Border */}
      <div className="absolute inset-1 border-2 border-white"></div>
      
      {/* Inner Border */}
      <div className="absolute inset-8 border-2 border-white"></div>
      
      {/* Main Certificate Content */}
      <div className="relative bg-white h-full mx-6 my-6 p-8 flex flex-col">
        
        {/* Header with Logo */}
        <div className="flex justify-between items-start mb-6">
          <div className="text-sm text-gray-600">
            C.ID: {certificateData?.certificateId || 'BEEJA-175035933086-165'}
          </div>
          <div className="flex items-center gap-3">
            {/* Beeja Academy Logo */}
            <div className="w-12 h-12 relative">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center relative overflow-hidden">
                {/* Leaf elements */}
                <div className="absolute top-0 left-2 w-2 h-3 bg-cyan-300 rounded-full transform rotate-12"></div>
                <div className="absolute top-0 left-3 w-1 h-2 bg-cyan-200 rounded-full transform rotate-45"></div>
                <div className="absolute top-0 left-4 w-1 h-2 bg-cyan-200 rounded-full transform -rotate-12"></div>
                {/* Main spiral */}
                <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-lg font-bold text-gray-800">Beeja Academy</h1>
              <p className="text-xs text-gray-500">LEARNING PLATFORM</p>
            </div>
          </div>
        </div>

        {/* Certificate Title */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-blue-700 mb-2" style={{ fontFamily: 'serif' }}>
            Beeja Academy Certificate of Completion
          </h2>
        </div>

        {/* Certificate Body */}
        <div className="flex-1 flex flex-col justify-center space-y-6">
          
          {/* Student Name */}
          <div className="text-center">
            <div className="border-b-2 border-gray-400 pb-2 mx-auto" style={{ width: '400px' }}>
              <span className="text-2xl font-bold text-gray-800">
                {certificateData?.studentName || 'Student Name'}
              </span>
            </div>
          </div>

          {/* Has Earned Section */}
          <div className="text-center space-y-2">
            <p className="text-xl italic" style={{ fontFamily: 'cursive' }}>has earned</p>
            <p className="text-lg font-bold">Course Completion Certificate</p>
          </div>

          {/* Course Title Section */}
          <div className="text-center space-y-2">
            <p className="text-lg italic" style={{ fontFamily: 'cursive' }}>
              while completing the Course program entitled
            </p>
          </div>

          {/* Course Name */}
          <div className="text-center">
            <div className="border-b-2 border-gray-400 pb-2 mx-auto" style={{ width: '500px' }}>
              <span className="text-lg font-bold">
                {certificateData?.courseName || 'Web Development Internship Program'}
              </span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-between items-end mt-8">
          
          {/* Left Side - Institution */}
          <div className="text-center" style={{ width: '200px' }}>
            <p className="text-sm mb-2">Beeja Academy</p>
            <div className="border-b border-gray-400 mb-2 h-8"></div>
            <p className="text-xs font-bold">Learning Institution</p>
          </div>

          {/* Center - QR Code */}
          <div className="flex flex-col items-center">
            {qrCodeUrl && (
              <div className="mb-2">
                <img src={qrCodeUrl} alt="Certificate QR Code" className="w-16 h-16 border border-gray-300" />
                <p className="text-xs text-gray-500 mt-1 text-center">Verify Online</p>
              </div>
            )}
          </div>

          {/* Right Side - Date */}
          <div className="text-center" style={{ width: '200px' }}>
            <p className="text-sm mb-2">Date Completed</p>
            <div className="border-b border-gray-400 mb-2 h-8 flex items-end justify-center">
              <span className="text-sm">
                {formatDate(certificateData?.completionDate) || 'June 20, 2025'}
              </span>
            </div>
            <p className="text-xs font-bold">Completion Date</p>
          </div>

        </div>

      </div>
    </div>
  );
}
